// Integration setup: ensure Better Auth has the env it needs. DATABASE_URL is
// already injected from .env.test by dotenv-cli before vitest starts; here we
// only provide fixed auth env so betterAuth() can initialize in tests.
process.env.BETTER_AUTH_SECRET ||= "integration-test-secret-not-for-production";
process.env.BETTER_AUTH_URL ||= "http://localhost:3000";

// Fail fast if a real database URL is not present, so we never silently pass.
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is not set. Run integration tests via `pnpm run test:integration` (loads .env.test).",
  );
}

// Log the datasource host once so it is obvious which branch we hit (must be
// the test branch, never production).
console.log(
  `[integration] datasource host: ${new URL(process.env.DATABASE_URL).host}`,
);
