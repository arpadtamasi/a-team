// Shared workspace fixtures for the jsdom board tests. Node-environment tests never
// import this file — it exists so each board test can state only what it is about.
import type { Workspace } from "../../ui/src/App";

type Ticket = Workspace["tickets"][number];
type Package = Workspace["packages"][number];
type Finding = Workspace["findings"][number];
type Decision = NonNullable<Workspace["decisions"]>[number];

export function ticket(id: string, title: string, over: Partial<Ticket> = {}): Ticket {
  return {
    id, title, status: "backlog", types: ["feature"], profiles: [], priority: "medium", risk: "low",
    package: null, depends_on: [], blocks: [], sections: {}, updated_at: "2026-07-30", ...over,
  };
}
export function pkg(id: string, title: string, over: Partial<Package> = {}): Package {
  return { id, title, status: "backlog", kind: "batch", tickets: [], sections: { goal: "One module." }, updated_at: "2026-07-20", ...over };
}
export function finding(id: string, title: string, over: Partial<Finding> = {}): Finding {
  return {
    id, title, status: "new", finding_type: "bug", severity: "medium", confidence: "high",
    created_at: "2026-07-28", sections: { evidence: "Seen twice." }, ...over,
  };
}
export function decision(id: string, title: string, over: Partial<Decision> = {}): Decision {
  return { id, title, date: "2026-07-26", sections: { decision: "The directory is the state." }, ...over };
}

export function workspace(over: Partial<Workspace> = {}): Workspace {
  return {
    project: "a-team", workspace: "/repo/.a-team", migration: null,
    tickets: [], packages: [], findings: [], decisions: [], diagnostics: [], ...over,
  };
}
