/**
 * Refuses to run the local integration suite when .env.test and .env resolve to
 * the same database.
 *
 * The suite truncates tables between runs (tests/integration/helpers.ts,
 * resetDb), which is deliberate: TRUNCATE is left outside the immutability
 * trigger so fixtures can reset (ADR-013 section 1). Sharing one database with
 * .env therefore destroys development data on every run, and TRUNCATE is not
 * recoverable.
 *
 * Guards the local script only. test:integration:ci reads DATABASE_URL from the
 * environment and has no .env.test.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

/** DATABASE_URL from a dotenv file, or null when absent. */
function readDatabaseUrl(fileName) {
  let contents;
  try {
    contents = readFileSync(join(packageRoot, fileName), "utf8");
  } catch {
    return null;
  }
  // Last assignment wins, matching dotenv-cli.
  let value = null;
  for (const line of contents.split(/\r?\n/)) {
    const match = /^\s*(?:export\s+)?DATABASE_URL\s*=\s*(.*)$/.exec(line);
    if (match) {
      value = match[1].trim().replace(/^["']|["']$/g, "");
    }
  }
  return value || null;
}

/**
 * Host and database name only — never the credentials.
 *
 * The `-pooler` suffix is dropped: Neon exposes the same database through a
 * direct and a pooled endpoint, so comparing the raw hosts would read two
 * spellings of one database as two databases.
 */
function identify(rawUrl) {
  try {
    const url = new URL(rawUrl);
    return `${url.host.replace("-pooler.", ".")}${url.pathname}`;
  } catch {
    return null;
  }
}

function fail(lines) {
  console.error(`\n  Integration suite blocked.\n`);
  for (const line of lines) {
    console.error(`  ${line}`);
  }
  console.error("");
  process.exit(1);
}

const testUrl = readDatabaseUrl(".env.test");
if (!testUrl) {
  fail([
    "No DATABASE_URL found in clear-fund/.env.test",
    "The local integration suite needs its own database. Point .env.test at a",
    "branch used by nothing else, then run this again.",
  ]);
}

const testTarget = identify(testUrl);
if (!testTarget) {
  fail(["DATABASE_URL in .env.test is not a valid URL."]);
}

const devUrl = readDatabaseUrl(".env");
const devTarget = devUrl ? identify(devUrl) : null;

if (devTarget && devTarget === testTarget) {
  fail([
    `.env.test and .env both point to ${testTarget}`,
    "",
    "This suite truncates its tables between runs, so running it here would",
    "erase the data in .env — users, cash funds and cash movements. TRUNCATE",
    "cannot be undone.",
    "",
    "Create a separate database branch for tests and point .env.test at it.",
  ]);
}

console.log(`  integration target: ${testTarget}`);
console.log(`  dev target:         ${devTarget ?? "(.env has no DATABASE_URL)"}`);
