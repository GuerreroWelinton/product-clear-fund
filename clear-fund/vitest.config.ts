import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

// Unit config (used by `pnpm test` and CI). It must NEVER touch the database,
// so integration tests are excluded here and run via vitest.integration.config.ts.
export default defineConfig({
  test: {
    environment: "node",
    include: [
      "src/**/*.{test,spec}.{ts,tsx}",
      "tests/*.{test,spec}.ts",
    ],
    exclude: ["tests/integration/**", "node_modules/**"],
    coverage: {
      provider: "v8",
      reportsDirectory: "./coverage",
      include: ["src/**/*.{ts,tsx}"],
    },
  },
  resolve: {
    alias: {
      "@": resolve(import.meta.dirname, "./src"),
    },
  },
});
