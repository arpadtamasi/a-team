import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";

export default defineConfig(({ command, isPreview }) => ({
  root: fileURLToPath(new URL(".", import.meta.url)),
  base: command === "build" || isPreview ? "/a-team/" : "/",
  build: {
    outDir: fileURLToPath(new URL("../site-dist", import.meta.url)),
    emptyOutDir: true,
  },
}));
