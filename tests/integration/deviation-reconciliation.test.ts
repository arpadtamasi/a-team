import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import { validateContractFile } from "../../src/core/validation.js";

const SECTIONS = `## Outcome\n\nThe flow is documented.\n\n## Scope\n\nWrite the document.\n\n## Non-goals\n\nNo diagrams.\n\n## Acceptance\n\n- Documentation describes the flow.\n\n## Verification\n\n- Read the rendered documentation.\n\n## Constraints\n\nNone.\n\n## Open decisions\n\nNone.\n\n## Execution notes\n\nNone.\n`;

interface ContractOptions {
  state?: string;
  resolution?: string;
  deviations: string;
  verification: string;
}

const contract = ({ state = "done", resolution = "completed", deviations, verification }: ContractOptions) => {
  const root = mkdtempSync(join(tmpdir(), "kotta-deviation-"));
  const directory = join(root, state);
  mkdirSync(directory, { recursive: true });
  const path = join(directory, "T-001-document-flow.md");
  const frontmatter = `---\nid: T-001\ntitle: Document flow\nstatus: ${state}\ntypes:\n  - documentation\nprofiles: []\n${state === "done" ? `resolution: ${resolution}\n` : ""}---\n`;
  const evidence = `\n## Review evidence\n\n| Acceptance condition | Evidence |\n|---|---|\n| Documentation describes the flow | flow.md inspected |\n\n### Verification performed\n\n${verification}\n\n### Deviations\n\n${deviations}\n\n### Observations created\n\nNot declared.\n\n### Known concerns\n\nNot declared.\n`;
  writeFileSync(path, `${frontmatter}\n# T-001 — Document flow\n\n${SECTIONS}${evidence}`);
  return path;
};

const codes = (path: string) => validateContractFile(path).errors.map((error) => error.code);

describe("deviation reconciliation (F-019)", () => {
  test("'None.' plus a deviation in the narrative fails validation", () => {
    const path = contract({ deviations: "None.", verification: "flow.md inspected.\nDEVIACIOK: a HTTP endpoint nem keszult el." });
    expect(codes(path)).toContain("DEVIATION_MISMATCH");
    expect(validateContractFile(path).errors.find((error) => error.code === "DEVIATION_MISMATCH")?.message).toContain("DEVIACIOK");
  });

  test("'Not declared.' plus a deviation in the narrative fails validation", () => {
    const path = contract({ deviations: "Not declared.", verification: "flow.md inspected.\nOne deviation: the diagram was skipped." });
    expect(codes(path)).toContain("DEVIATION_MISMATCH");
  });

  test("a declared deviation list passes however often the word appears", () => {
    const path = contract({
      deviations: "The diagram was skipped; the contract allowed text only.",
      verification: "flow.md inspected.\nDEVIACIOK: a diagram kimaradt.\nA deviation is recorded above.",
    });
    expect(codes(path)).not.toContain("DEVIATION_MISMATCH");
  });

  test("'None.' with no deviation marker in the narrative passes", () => {
    const path = contract({ deviations: "None.", verification: "flow.md inspected; every acceptance condition met." });
    expect(codes(path)).not.toContain("DEVIATION_MISMATCH");
  });

  test("a narrative that denies deviations agrees with the field and passes", () => {
    const path = contract({ deviations: "None.", verification: "flow.md inspected. No deviations, observations, or known concerns.\nErdemi deviacio nincs." });
    expect(codes(path)).not.toContain("DEVIATION_MISMATCH");
  });

  test("the rule does not run before done", () => {
    const path = contract({ state: "review", deviations: "None.", verification: "flow.md inspected.\nDEVIACIOK: a HTTP endpoint nem keszult el." });
    expect(codes(path)).not.toContain("DEVIATION_MISMATCH");
  });
});
