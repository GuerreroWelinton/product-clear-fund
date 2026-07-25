// Integration setup: ensure Better Auth has the env it needs. DATABASE_URL comes
// from .env.test via dotenv-cli locally, or straight from the environment in CI
// (the Postgres service container); here we only provide fixed auth env so
// betterAuth() can initialize in tests.
process.env.BETTER_AUTH_SECRET ||= "integration-test-secret-not-for-production";
process.env.BETTER_AUTH_URL ||= "http://localhost:3000";

// Fail fast if a real database URL is not present, so we never silently pass.
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is not set. Locally run `pnpm run test:integration` (loads " +
      ".env.test); in CI set DATABASE_URL and run `pnpm run test:integration:ci`.",
  );
}

// Log the datasource host once so it is obvious which branch we hit (must be
// the test branch, never production).
console.log(
  `[integration] datasource host: ${new URL(process.env.DATABASE_URL).host}`,
);
