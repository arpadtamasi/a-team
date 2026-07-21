export interface ClaimData {
  ticket?: unknown;
  agent?: unknown;
  branch?: unknown;
  worktree?: unknown;
  started_at?: unknown;
}

export function validateClaim(data: ClaimData): string[] {
  const errors: string[] = [];
  if (!/^T-\d{3,}$/.test(String(data.ticket ?? ""))) errors.push("ticket must match T-001");
  if (!String(data.agent ?? "").trim()) errors.push("agent is required");
  if (!String(data.branch ?? "").trim()) errors.push("branch is required");
  if (!String(data.worktree ?? "").trim()) errors.push("worktree is required");
  if (Number.isNaN(Date.parse(String(data.started_at ?? "")))) errors.push("started_at must be an ISO timestamp");
  return errors;
}
