import { describe, expect, test } from "vitest";
import { sections } from "../../src/core/markdown.js";

describe("Markdown section parsing", () => {
  test("ignores headings quoted inside fenced examples", () => {
    const parsed = sections(`## Outcome

Real outcome.

\`\`\`markdown
## Not a real section
\`\`\`

## Scope

Bounded scope.
`);

    expect([...parsed.keys()]).toEqual(["outcome", "scope"]);
    expect(parsed.get("outcome")).toContain("Real outcome.");
  });
});
