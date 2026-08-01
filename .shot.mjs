import { chromium } from "@playwright/test";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 });
await p.goto("http://127.0.0.1:4188/");
await p.waitForTimeout(2000);
await p.locator(".rail").screenshot({ path: "/private/tmp/claude-501/-Users-rp-Dev-progos-a-team/49eb279b-d40c-4767-b05f-d3c407b17ce3/scratchpad/rail.png" });
await b.close();
