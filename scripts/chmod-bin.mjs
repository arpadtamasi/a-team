// Restore the executable bit on the CLI entrypoint after `tsc` emits it.
// tsc writes dist/cli/index.js as 0644, which strips the executable mode the
// published `kotta` (and legacy `a-team`) bin needs — the linked command then fails with
// "permission denied" (finding F-004). Set 0755 so the packed tarball ships
// an executable bin regardless of platform.
import { chmodSync } from "node:fs";
import { fileURLToPath } from "node:url";

const bin = fileURLToPath(new URL("../dist/cli/index.js", import.meta.url));
chmodSync(bin, 0o755);
