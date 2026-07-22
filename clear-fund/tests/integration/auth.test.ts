import { beforeEach, describe, expect, it } from "vitest";

import { createTreasurer, disableUser } from "@/modules/auth/application";

import {
  countSessions,
  prisma,
  resetDb,
  seedSuperAdmin,
  signIn,
} from "./helpers";

const ADMIN = { email: "admin@test.local", password: "admin-password-123" };
const TREASURER = {
  email: "tesorero@test.local",
  name: "Tesorero Uno",
  password: "treasurer-password-123",
};

beforeEach(async () => {
  await resetDb();
});

describe("F01 authentication and sessions (integration)", () => {
  // AC-F01-001: active user + valid credentials -> persistent session.
  it("AC-F01-001: valid sign-in creates a persistent session", async () => {
    const admin = await seedSuperAdmin(ADMIN);

    const result = await signIn(ADMIN);

    expect(result.ok).toBe(true);
    const sessions = await countSessions(admin.id);
    expect(sessions).toBeGreaterThanOrEqual(1);
  });

  // AC-F01-002: disabled user -> sign-in rejected.
  it("AC-F01-002: a disabled user cannot sign in", async () => {
    await seedSuperAdmin(ADMIN);
    const adminAuth = await signIn(ADMIN);
    const ctx = { headers: adminAuth.authHeaders };

    const treasurer = await createTreasurer(TREASURER, ctx);
    await disableUser({ userId: treasurer.id }, ctx);

    const attempt = await signIn(TREASURER);

    expect(attempt.ok).toBe(false);
    expect(await countSessions(treasurer.id)).toBe(0);
  });

  // AC-F01-003 / BR-F01-004: disabling a user revokes all their sessions.
  it("AC-F01-003: disabling a treasurer revokes all their active sessions", async () => {
    await seedSuperAdmin(ADMIN);
    const adminAuth = await signIn(ADMIN);
    const ctx = { headers: adminAuth.authHeaders };

    const treasurer = await createTreasurer(TREASURER, ctx);

    // Treasurer signs in -> at least one active session exists.
    const treasurerAuth = await signIn(TREASURER);
    expect(treasurerAuth.ok).toBe(true);
    expect(await countSessions(treasurer.id)).toBeGreaterThanOrEqual(1);

    // Super Admin disables the treasurer.
    await disableUser({ userId: treasurer.id }, ctx);

    // Every session for that user must be gone.
    expect(await countSessions(treasurer.id)).toBe(0);

    // Sanity: the user still exists (disabled, not deleted) and is banned.
    const row = await prisma.user.findUnique({ where: { id: treasurer.id } });
    expect(row?.banned).toBe(true);
  });
});
