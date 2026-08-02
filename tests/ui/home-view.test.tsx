// @vitest-environment jsdom
//
// Home is the landing view: three bands, in the design's order and wording. These tests
// drive the four states the board can be in when it opens — loading, default, empty and
// error — and they pin the one derivation that is easy to get wrong: a defined backlog
// contract is a menu item under "What runs next?", never a queue item under "Waiting on you".
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { HomeView, readBoard } from "../../ui/src/App";
import { finding, pkg, ticket, workspace } from "./fixtures";

afterEach(cleanup);

const populated = workspace({
  tickets: [
    ticket("T-001", "Define the shaping plan schema", { status: "ready", package: "P-001" }),
    ticket("T-002", "Introduce a shared mutation lock", { status: "ready", blocks: ["T-003"] }),
    ticket("T-003", "Transactional shape apply", { status: "review" }),
    ticket("T-004", "Publish the onboarding site", { status: "done", package: "P-002" }),
  ],
  packages: [pkg("P-001", "Code-aware synthesis", { tickets: ["T-001"] }), pkg("P-002", "Trustworthy onboarding", { tickets: ["T-004"] })],
  findings: [finding("F-007", "Triage-assistant agent"), finding("F-009", "The board has no decisions surface")],
});

function renderHome(over: Partial<Parameters<typeof HomeView>[0]> = {}) {
  const board = over.board === undefined ? readBoard(populated) : over.board;
  return render(<HomeView
    workspace={over.workspace === undefined ? populated : over.workspace}
    board={board}
    error={over.error ?? null}
    onView={over.onView ?? (() => {})}
    onOpen={over.onOpen ?? (() => {})}
    onRetry={over.onRetry ?? (() => {})}
  />);
}

const band = (name: string) => screen.getByRole("region", { name });

describe("Home — the three bands", () => {
  it("shows the bands in the design's order, with the design's wording", () => {
    renderHome();
    const headings = screen.getAllByRole("heading", { level: 2 }).map((node) => node.textContent);
    expect(headings).toEqual(["Waiting on you", "Doesn't add up", "What runs next?"]);
    expect(screen.getByText(/Exactly where the CLI refuses without/)).toBeDefined();
    expect(screen.getByText("Two sources disagree, or the data contradicts its own definition. The board will not pick a story.")).toBeDefined();
    expect(screen.getByText(/A menu, not a debt\./)).toBeDefined();
  });

  it("derives Waiting on you from the three --approve gates, and nothing else", () => {
    renderHome();
    const waiting = band("Waiting on you");
    expect(within(waiting).getByText("Observations without a disposition")).toBeDefined();
    expect(within(waiting).getByText("Contracts waiting for review")).toBeDefined();
    expect(within(waiting).getByText("Batches waiting to be closed")).toBeDefined();
    // two undisposed findings, one contract in review, one all-done batch
    expect(within(waiting).getAllByText(/^[0-9]+$/).map((node) => node.textContent)).toEqual(["2", "1", "1"]);
  });

  it("puts every defined contract under What runs next?, never in a queue", () => {
    renderHome();
    const menu = band("What runs next?");
    expect(within(menu).getByRole("button", { name: /Define the shaping plan schema/ })).toBeDefined();
    expect(within(menu).getByRole("button", { name: /Introduce a shared mutation lock/ })).toBeDefined();
    const waiting = band("Waiting on you");
    expect(within(waiting).queryByText(/Define the shaping plan schema/)).toBeNull();
    expect(within(waiting).queryByText(/Introduce a shared mutation lock/)).toBeNull();
    // The affordance names the CLI command; it does not run it.
    expect(within(menu).getByText("kotta ticket execute T-001 --agent codex")).toBeDefined();
    expect(within(menu).getByRole("button", { name: "Copy command: kotta ticket execute T-001 --agent codex" })).toBeDefined();
  });

  it("names the batch of a menu item by its title, with the id only as a marker", () => {
    renderHome();
    const menu = band("What runs next?");
    expect(within(menu).getByText("Code-aware synthesis")).toBeDefined();
    expect(within(menu).getByText("no batch")).toBeDefined();
    expect(within(menu).getByText("unblocks 1 other")).toBeDefined();
  });

  it("routes a queue row to the view that holds it", () => {
    const onView = vi.fn();
    renderHome({ onView });
    fireEvent.click(screen.getByRole("button", { name: /Contracts waiting for review/ }));
    expect(onView).toHaveBeenCalledWith("contracts", "review");
  });
});

describe("Home — loading", () => {
  it("keeps every band heading and shows a quiet placeholder until the read resolves", () => {
    renderHome({ board: null, workspace: null });
    expect(screen.getAllByRole("heading", { level: 2 }).map((n) => n.textContent))
      .toEqual(["Waiting on you", "Doesn't add up", "What runs next?"]);
    expect(screen.getAllByRole("status", { name: "" }).length).toBe(3);
    expect(screen.getAllByText("Reading the workspace…").length).toBe(3);
    expect(screen.queryByText(/Nothing waiting to decide/)).toBeNull();
  });
});

describe("Home — empty workspace", () => {
  it("states the good news in words in all three bands and says how to start", () => {
    renderHome({ workspace: workspace(), board: readBoard(workspace()) });
    expect(screen.getByText(/Nothing waiting to decide/)).toBeDefined();
    expect(screen.getByText(/Nothing contradictory/)).toBeDefined();
    expect(screen.getByText(/Nothing defined to run/)).toBeDefined();
    expect(screen.getByText('kotta ticket new --title "…" --type feature')).toBeDefined();
    expect(screen.queryByText(/See all/)).toBeNull();
  });
});

describe("Home — error", () => {
  it("says what it tried to read, why it failed, and offers a retry per band", () => {
    const onRetry = vi.fn();
    renderHome({ board: null, workspace: null, error: "the server answered HTTP 500", onRetry });
    expect(screen.getAllByRole("alert").length).toBe(3);
    expect(screen.getAllByText("The workspace could not be read.").length).toBe(3);
    expect(screen.getAllByText(/GET \/api\/workspace/).length).toBe(3);
    expect(screen.getAllByText(/the server answered HTTP 500/).length).toBe(3);
    fireEvent.click(screen.getAllByRole("button", { name: "Retry" })[0]);
    expect(onRetry).toHaveBeenCalled();
  });
});

describe("Doesn't add up", () => {
  it("shows a dangling reference as a contradiction between the frontmatter and the disk", () => {
    const broken = workspace({ tickets: [ticket("T-010", "Show worktree state", { source_finding: "F-404" })] });
    renderHome({ workspace: broken, board: readBoard(broken) });
    const contradictions = band("Doesn't add up");
    expect(within(contradictions).getByText("dangling reference")).toBeDefined();
    expect(within(contradictions).getByText("source_finding: F-404")).toBeDefined();
    expect(within(contradictions).getByText("kotta validate")).toBeDefined();
  });

  it("shows a batch and a contract that disagree about membership", () => {
    const drifted = workspace({
      tickets: [ticket("T-020", "Sweep unfinished work", { package: "P-009" })],
      packages: [pkg("P-009", "Daily use", { tickets: [] })],
    });
    renderHome({ workspace: drifted, board: readBoard(drifted) });
    const contradictions = band("Doesn't add up");
    expect(within(contradictions).getByText("membership")).toBeDefined();
    expect(within(contradictions).getByText("The contract claims a batch that does not list it")).toBeDefined();
  });
});
