// @vitest-environment jsdom
//
// The three chain views and Decisions. What they must get right: the design's numbering and
// wording, filters that filter, and — the rule that outranks the design's own mock — an entity
// is named by its title, with the short id only as a marker beside it (D-003, D-01kz1yqm…).
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { BatchesView, ContractsView, DecisionsView, ObservationsView, readBoard } from "../../ui/src/App";
import { decision, finding, pkg, ticket, workspace } from "./fixtures";

afterEach(cleanup);

const data = workspace({
  tickets: [
    ticket("T-01kz1xrxw4aheeqv1ca0bv0fcq", "A board átállítása a Kotta Console v2 tervre", { status: "ready", source_finding: "F-010" }),
    ticket("T-012", "Make the UI workspace argument explicit", { status: "active", package: "P-003", assigned_agent: "codex" }),
    ticket("T-029", "Reading the board makes no per-file git call", { status: "done", package: "P-003" }),
  ],
  packages: [pkg("P-003", "Trustworthy daily use", { status: "active", tickets: ["T-012", "T-029"], sections: { goal: "One module: truthful execution state." } })],
  findings: [
    finding("F-010", "The local UI is visually overcrowded", { created_at: "2026-06-01", discovered_during: "T-012" }),
    finding("F-002", "The board hides worktree state", { status: "resolved", became: "T-029" }),
  ],
  decisions: [decision("D-003", "Entity identity is a coordination-free ULID"), decision("D-010", "Existing identifiers stay", { date: "2026-08-02", sections: { decision: "Narrows D-003." } })],
});
const board = readBoard(data);

describe("Observations", () => {
  it("carries the design's step, wording and disk note", () => {
    render(<ObservationsView board={board} filter="waiting" onFilter={() => {}} onOpen={() => {}} />);
    expect(screen.getByText("01 · new information")).toBeDefined();
    expect(screen.getByRole("heading", { name: "Observations" })).toBeDefined();
    expect(screen.getByText(/Each one waits for one yes\/no — and stales\./)).toBeDefined();
    expect(screen.getByText(/stored as/).textContent).toContain("finding");
    expect(screen.getByText(".a-team/findings/")).toBeDefined();
  });

  it("shows the waiting queue by title, ages it, and reports a filter change", () => {
    const onFilter = vi.fn();
    render(<ObservationsView board={board} filter="waiting" onFilter={onFilter} onOpen={() => {}} />);
    const row = screen.getByRole("button", { name: /The local UI is visually overcrowded/ });
    expect(row.textContent).toContain("days old");
    expect(row.textContent).toContain("seen during Make the UI workspace argument explicit");
    expect(screen.queryByText("The board hides worktree state")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /dispositioned/ }));
    expect(onFilter).toHaveBeenCalledWith("dispositioned");
  });

  it("shows what a dispositioned observation became, by title", () => {
    render(<ObservationsView board={board} filter="dispositioned" onFilter={() => {}} onOpen={() => {}} />);
    expect(screen.getByText("→ Reading the board makes no per-file git call")).toBeDefined();
  });
});

describe("Contracts", () => {
  const contracts = (filter: "all" | "ready" = "all", query = "") =>
    render(<ContractsView board={board} filter={filter} onFilter={() => {}} query={query} onQuery={() => {}} onOpen={() => {}} />);

  it("treats done as a filter value, not a place", () => {
    contracts();
    expect(screen.getByText("02 · tickets")).toBeDefined();
    expect(screen.getByText("One entity, five states. Done is a filter value here, not a place of its own.")).toBeDefined();
    const states = ["all", "backlog", "defined", "active", "review", "done"];
    for (const state of states) expect(screen.getByRole("button", { name: new RegExp(`^${state}`) })).toBeDefined();
  });

  it("names a contract by its title and its batch by the batch's title", () => {
    contracts();
    const row = screen.getByRole("button", { name: /Make the UI workspace argument explicit/ });
    expect(row.textContent).toContain("Trustworthy daily use");
    expect(row.textContent).toContain("codex");
  });

  it("shows a minted id as its short tail only — never the whole ULID", () => {
    contracts();
    const minted = screen.getByRole("button", { name: /A board átállítása a Kotta Console v2 tervre/ });
    expect(minted.textContent).toContain("T-a0bv0fcq");
    expect(minted.textContent).not.toContain("T-01kz1xrxw4aheeqv1ca0bv0fcq");
    // The full id stays reachable, in the row's title attribute, behind the human label.
    expect(minted.getAttribute("title")).toBe("A board átállítása a Kotta Console v2 tervre · T-01kz1xrxw4aheeqv1ca0bv0fcq");
  });

  it("filters by state and by search", () => {
    cleanup();
    contracts("ready");
    expect(screen.getByText("A board átállítása a Kotta Console v2 tervre")).toBeDefined();
    expect(screen.queryByText("Reading the board makes no per-file git call")).toBeNull();
    cleanup();
    contracts("all", "per-file");
    expect(screen.getByText("Reading the board makes no per-file git call")).toBeDefined();
    expect(screen.queryByText("Make the UI workspace argument explicit")).toBeNull();
  });
});

describe("Batches", () => {
  it("groups by reason, not by calendar, and shows progress", () => {
    render(<BatchesView board={board} onOpen={() => {}} />);
    expect(screen.getByText("03 · sequencing")).toBeDefined();
    expect(screen.getByText("Things that must be solved together — a module, or a clean-up. Reason, not calendar.")).toBeDefined();
    const card = screen.getByRole("button", { name: /Trustworthy daily use/ });
    expect(card.textContent).toContain("1/2");
    expect(card.textContent).toContain("One module: truthful execution state.");
  });
});

describe("Decisions", () => {
  it("lists decisions newest first, by title, and points at what they read with", () => {
    const onOpen = vi.fn();
    render(<DecisionsView board={board} onOpen={onOpen} />);
    const titles = screen.getAllByRole("button").map((node) => node.textContent ?? "");
    expect(titles[0]).toContain("Existing identifiers stay");
    expect(titles[0]).toContain("reads with Entity identity is a coordination-free ULID");
    fireEvent.click(screen.getByRole("button", { name: /Existing identifiers stay/ }));
    expect(onOpen).toHaveBeenCalledWith("D-010");
  });
});
