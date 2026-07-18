// vitest.config.ts

import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    // Points the db layer at a throwaway SQLite file per test file
    setupFiles: ["./tests/setup.ts"],
  },
});
