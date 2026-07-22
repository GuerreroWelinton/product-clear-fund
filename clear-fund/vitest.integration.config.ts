import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

// Integration config. Runs ONLY tests/integration against a real Postgres
// (the Neon test branch, whose DATABASE_URL is injected from .env.test via
// dotenv-cli before vitest starts). Kept separate so `pnpm test` (unit/CI)
// never hits the database.
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/integration/**/*.{test,spec}.ts"],
    setupFiles: ["tests/integration/setup.ts"],
    testTimeout: 30_000,
    hookTimeout: 30_000,
    // Shared database: never run integration files in parallel (tests within a
    // file already run sequentially). Single fork keeps one DB connection.
    fileParallelism: false,
    pool: "forks",
    maxWorkers: 1,
  },
  resolve: {
    alias: {
      "@": resolve(import.meta.dirname, "./src"),
    },
  },
});
