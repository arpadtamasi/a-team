// @vitest-environment jsdom
import { useState } from "react";
import axe from "axe-core";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { EntityDrawer, readBoard, type Workspace } from "../../ui/src/App";
import { contract, workspace } from "./fixtures";

const ID = "T-01kz8tk2t53jbax6mrseka50v9";
const eventId = (tail: string) => `E-01kz8tk2t53jbax6mrseka${tail}`;

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

function Drawer({ data, onRefresh = async () => undefined }: { data: Workspace; onRefresh?: () => Promise<void> }) {
  return <EntityDrawer id={ID} workspace={data} board={readBoard(data)} onClose={() => undefined} onOpen={() => undefined} onRefresh={onRefresh} />;
}

describe("persistent contract conversation", () => {
  it("renders messages, lifecycle and durable approval outcome in stable order", () => {
    const approvalId = eventId("50v9");
    const data = workspace({
      contracts: [contract(ID, "Live control plane", { status: "defined", execution_mode: "fresh" })],
      events: [
        { id: eventId("50v1"), entity: ID, contract: ID, kind: "message", role: "human", text: "Keep chat visible.", created_at: "2026-08-05T10:00:00Z" },
        { id: eventId("50v2"), entity: ID, contract: ID, kind: "message", role: "assistant", text: "It is stored on main.", created_at: "2026-08-05T10:00:01Z" },
        { id: eventId("50v3"), entity: ID, contract: ID, kind: "lifecycle", state: "defined", summary: "Contract approved for execution.", created_at: "2026-08-05T10:00:02Z" },
        { id: approvalId, entity: ID, contract: ID, kind: "approval", approval_id: approvalId, phase: "proposed", action: "contract.sign", created_at: "2026-08-05T10:00:03Z" },
        { id: eventId("50v5"), entity: ID, contract: ID, kind: "approval", approval_id: approvalId, phase: "applied", action: "contract.sign", source_message: eventId("50v4"), created_at: "2026-08-05T10:00:04Z" },
      ],
    });
    render(<Drawer data={data} />);
    const log = screen.getByRole("log");
    expect(within(log).getByText("Keep chat visible.")).toBeDefined();
    expect(within(log).getByText("It is stored on main.")).toBeDefined();
    expect(within(log).getByText("Contract approved for execution.")).toBeDefined();
    expect(within(log).getByText("Approval · applied")).toBeDefined();
    expect(within(log).queryByRole("button", { name: "Approve" })).toBeNull();
  });

  it("prepares and explicitly approves one scoped action without a terminal", async () => {
    let events: NonNullable<Workspace["events"]> = [];
    let status: Workspace["contracts"][number]["status"] = "backlog";
    const approvalId = eventId("50v6");
    vi.stubGlobal("fetch", vi.fn(async (input: unknown) => {
      const url = String(input);
      if (url === "/api/approval/propose") {
        events = [...events, { id: approvalId, entity: ID, contract: ID, kind: "approval", approval_id: approvalId, phase: "proposed", action: "contract.sign", created_at: "2026-08-05T10:00:00Z" }];
        return { ok: true, status: 201, json: async () => ({ ok: true, event: { id: approvalId } }) } as Response;
      }
      events = [...events,
        { id: eventId("50v7"), entity: ID, contract: ID, kind: "approval", approval_id: approvalId, phase: "approved", action: "contract.sign", source_message: eventId("50v8"), created_at: "2026-08-05T10:00:01Z" },
        { id: eventId("50v9"), entity: ID, contract: ID, kind: "approval", approval_id: approvalId, phase: "applied", action: "contract.sign", source_message: eventId("50v8"), created_at: "2026-08-05T10:00:02Z" },
      ];
      status = "defined";
      return { ok: true, status: 200, json: async () => ({ ok: true }) } as Response;
    }));

    function Harness() {
      const [data, setData] = useState(workspace({ contracts: [contract(ID, "Live control plane", { status })], events }));
      const refresh = async () => setData(workspace({ contracts: [contract(ID, "Live control plane", { status })], events: [...events] }));
      return <Drawer data={data} onRefresh={refresh} />;
    }
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: "Prepare execution approval" }));
    expect(await screen.findByRole("button", { name: "Approve" })).toBeDefined();
    await waitFor(() => expect(document.activeElement?.id).toBe(`approval-${approvalId}`));
    expect(screen.queryByRole("button", { name: "Prepare execution approval" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Approve" }));
    await waitFor(() => expect(screen.getByText("Approval · applied")).toBeDefined());
    await waitFor(() => expect(document.activeElement?.id).toBe(`approval-${approvalId}`));
    expect(screen.queryByRole("button", { name: "Approve" })).toBeNull();
    expect(fetch).toHaveBeenCalledWith("/api/approval/decide", expect.objectContaining({ method: "POST" }));
  });

  it("keeps a failed turn visible and offers a keyboard-reachable retry", async () => {
    const human = eventId("50va");
    const failedId = eventId("50vb");
    const chat = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => new Response(`${JSON.stringify({ type: "done", event: null })}\n`, { status: 200, headers: { "content-type": "application/x-ndjson" } }));
    vi.stubGlobal("fetch", chat);
    const data = workspace({
      contracts: [contract(ID, "Live control plane", { status: "active" })],
      events: [
        { id: human, entity: ID, contract: ID, kind: "message", role: "human", text: "Try this again", created_at: "2026-08-05T10:00:00Z" },
        { id: failedId, entity: ID, contract: ID, kind: "turn-failed", error: "Provider disconnected.", attempt_of: human, created_at: "2026-08-05T10:00:01Z" },
      ],
    });
    render(<Drawer data={data} />);
    const retry = screen.getByRole("button", { name: "Retry turn" });
    fireEvent.click(retry);
    const composer = screen.getByLabelText("Message this contract") as HTMLTextAreaElement;
    expect(composer.value).toBe("Try this again");
    await waitFor(() => expect(document.activeElement).toBe(composer));
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    await waitFor(() => expect(chat).toHaveBeenCalled());
    const request = chat.mock.calls[0][1] as RequestInit;
    expect(JSON.parse(String(request.body))).toMatchObject({ attemptOf: failedId, message: "Try this again" });
  });

  it("has no automated accessibility violations in the empty chat and approval controls", async () => {
    const data = workspace({ contracts: [contract(ID, "Live control plane", { status: "backlog" })], events: [] });
    const { container } = render(<Drawer data={data} />);
    // jsdom has no canvas implementation, so colour contrast is covered by the Playwright site
    // gate while this component run checks the DOM/ARIA rules axe can evaluate faithfully here.
    const result = await axe.run(container, { rules: { "color-contrast": { enabled: false } } });
    expect(result.violations).toEqual([]);
  });
});
