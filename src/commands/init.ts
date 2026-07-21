import { initializeWorkspace } from "../filesystem/workspace.js";

export function initCommand(projectName?: string) {
  const result = initializeWorkspace({ projectName });
  return { ok: true, command: "init", data: { root: result.root } };
}
