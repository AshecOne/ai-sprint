import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    // The simulation engine is pure TS (no DOM/React), so a node environment
    // is enough and keeps the suite fast.
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
