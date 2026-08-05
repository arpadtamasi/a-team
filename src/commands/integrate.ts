import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { findRepositoryRoot } from "../filesystem/workspace.js";

export const CODEX_MCP_CONFIG = `[mcp_servers.kotta]
command = "kotta"
args = ["mcp", "--workspace", "."]
enabled = true
required = false
startup_timeout_sec = 10
tool_timeout_sec = 120
default_tools_approval_mode = "auto"

[mcp_servers.kotta.tools.approval_request]
approval_mode = "approve"
`;

export function integrateCodex(repositoryRoot?: string) {
  const root = findRepositoryRoot(repositoryRoot);
  const directory = join(root, ".codex");
  const path = join(directory, "config.toml");
  mkdirSync(directory, { recursive: true });
  const existing = existsSync(path) ? readFileSync(path, "utf8") : "";
  if (/^\s*\[mcp_servers\.kotta\]\s*$/m.test(existing)) {
    return { ok: true, command: "integrate codex", data: { path, changed: false } };
  }
  const prefix = existing && !existing.endsWith("\n") ? `${existing}\n` : existing;
  const separator = prefix.trim() ? "\n# Kotta caller-chat control plane\n" : "";
  writeFileSync(path, `${prefix}${separator}${CODEX_MCP_CONFIG}`);
  return { ok: true, command: "integrate codex", data: { path, changed: true } };
}
