import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  createUser,
  banUser,
  unbanUser,
  revokeUserSessions,
  getSession,
  userFindUnique,
  sessionCount,
  auditCreate,
} = vi.hoisted(() => ({
  createUser: vi.fn(),
  banUser: vi.fn(),
  unbanUser: vi.fn(),
  revokeUserSessions: vi.fn(),
  getSession: vi.fn(),
  userFindUnique: vi.fn(),
  sessionCount: vi.fn(),
  auditCreate: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  auth: {
    api: { createUser, banUser, unbanUser, revokeUserSessions, getSession },
  },
  ROLES: { SUPER_ADMIN: "SUPER_ADMIN", TREASURER: "TREASURER" },
}));

// F01's audit wiring (ADR-013) resolves the acting admin from the session, reads
// the previous user state, and appends the event through the SHARED client:
// Better Auth owns these writes, so there is no transaction to join.
vi.mock("@/lib/db", () => ({
  prisma: {
    user: { findUnique: userFindUnique },
    session: { count: sessionCount },
    auditEvent: { create: auditCreate },
  },
}));

import { F01_ERROR_CODES } from "../domain/errors";
import { revokeUserSessions as revokeUserSessionsUseCase } from "./revoke-user-sessions";

const headers = new Headers();

beforeEach(() => {
  vi.clearAllMocks();
  getSession.mockResolvedValue({
    user: { id: "admin-1", email: "admin@example.com", role: "SUPER_ADMIN" },
  });
  userFindUnique.mockResolvedValue({
    banned: false,
    banReason: null,
    role: "TREASURER",
  });
  sessionCount.mockResolvedValue(0);
  auditCreate.mockResolvedValue({ id: "event-1" });
});

describe("revokeUserSessions", () => {
  it("revokes all sessions for a user", async () => {
    revokeUserSessions.mockResolvedValue({ success: true });

    const result = await revokeUserSessionsUseCase({ userId: "user-1" }, { headers });

    expect(revokeUserSessions).toHaveBeenCalledWith({
      body: { userId: "user-1" },
      headers,
    });
    expect(result).toEqual({ success: true });
  });

  it("maps a forbidden caller to F01_UNAUTHORIZED", async () => {
    revokeUserSessions.mockRejectedValue({
      body: { code: "YOU_ARE_NOT_ALLOWED_TO_REVOKE_USERS_SESSIONS" },
    });
    await expect(
      revokeUserSessionsUseCase({ userId: "user-1" }, { headers }),
    ).rejects.toMatchObject({ code: F01_ERROR_CODES.UNAUTHORIZED });
  });
});
