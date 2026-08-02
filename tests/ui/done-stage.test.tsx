// @vitest-environment jsdom
//
// Exemplar component test for the React board. Copy this file's shape for new UI
// surfaces: render a component from `ui/src/`, assert what the user sees, drive one
// interaction, assert what changed. The docblock on line 1 is what puts this file in
// jsdom — without it the file runs in node like the rest of the suite.
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { DoneStage, type Workspace } from "../../ui/src/App";

afterEach(cleanup);

type Ticket = Workspace["tickets"][number];

function ticket(id: string, title: string, over: Partial<Ticket> = {}): Ticket {
  return {
    id, title, status: "done", types: ["chore"], profiles: [], priority: "P2", risk: "low",
    package: null, depends_on: [], resolution: "merged", sections: {}, ...over,
  };
}

function workspace(tickets: Ticket[]): Workspace {
  return { project: "a-team", migration: null, tickets, packages: [], findings: [] };
}

describe("DoneStage", () => {
  it("renders the archive header and only the resolved tickets", () => {
    render(<DoneStage
      workspace={workspace([
        ticket("T-041", "Component-test harness for the React board"),
        ticket("T-042", "Port fallback for the board server"),
        ticket("T-043", "Still running", { status: "active", resolution: undefined }),
      ])}
      onEntity={() => {}}
    />);

    expect(screen.getByRole("heading", { name: "Done" })).toBeDefined();
    expect(screen.getByText("Archive. Searchable, read-only, provenance intact.")).toBeDefined();
    expect(screen.getByText("Component-test harness for the React board")).toBeDefined();
    expect(screen.getByText("Port fallback for the board server")).toBeDefined();
    expect(screen.queryByText("Still running")).toBeNull();
  });

  it("filters the archive as the user types in the search box", () => {
    render(<DoneStage
      workspace={workspace([
        ticket("T-041", "Component-test harness for the React board"),
        ticket("T-042", "Port fallback for the board server"),
      ])}
      onEntity={() => {}}
    />);

    const search = screen.getByPlaceholderText("Search T-042, O-38, title…");
    fireEvent.change(search, { target: { value: "harness" } });

    expect(screen.getByText("Component-test harness for the React board")).toBeDefined();
    expect(screen.queryByText("Port fallback for the board server")).toBeNull();

    fireEvent.change(search, { target: { value: "nothing like this" } });
    expect(screen.getByText("No resolved work matches your search.")).toBeDefined();
    expect(screen.queryByText("Component-test harness for the React board")).toBeNull();
  });

  it("reports the clicked entity id to its caller", () => {
    const onEntity = vi.fn();
    render(<DoneStage workspace={workspace([ticket("T-041", "Component-test harness")])} onEntity={onEntity} />);

    fireEvent.click(screen.getByRole("button", { name: "T-041" }));
    expect(onEntity).toHaveBeenCalledWith("T-041");
  });
});
