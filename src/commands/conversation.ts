import { appendEvent, type KottaEvent } from "../core/events.js";
import { CONTRACT_ID } from "../core/identity.js";
import { findContract } from "../filesystem/entities.js";
import { findRepositoryRoot } from "../filesystem/workspace.js";
import { commitControlState, withControlPlaneMutation } from "../git/control-plane.js";

export function recordContractMessage(options: {
  contract: string;
  role: "human" | "assistant";
  text: string;
  clientEventId?: string;
  threadId?: string;
}, repositoryRoot?: string): { ok: true; command: "conversation record"; data: { event: KottaEvent; created: boolean } } {
  if (!CONTRACT_ID.test(options.contract)) throw new Error("A valid contract id is required.");
  if (!options.text.trim()) throw new Error("Visible message text is required.");
  return withControlPlaneMutation(repositoryRoot ?? findRepositoryRoot(), (root) => {
    findContract(root, options.contract);
    const result = appendEvent(root, {
      entity: options.contract,
      contract: options.contract,
      kind: "message",
      role: options.role,
      text: options.text.trim(),
      client_event_id: options.clientEventId ?? null,
      thread_id: options.threadId ?? null,
    });
    if (result.created) commitControlState(root, `chore(kotta): record ${options.role} message for ${options.contract}`);
    return { ok: true, command: "conversation record", data: { event: result.event, created: result.created } };
  }, { requireClean: false });
}
