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
import { disableUser } from "./disable-user";

const headers = new Headers();
const bannedUser = {
  id: "user-1",
  email: "tess@example.com",
  name: "Tess Treasurer",
  role: "TREASURER",
  banned: true,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-03T00:00:00.000Z"),
};

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

describe("disableUser", () => {
  it("bans the user and revokes their sessions (BR-F01-004)", async () => {
    banUser.mockResolvedValue({ user: bannedUser });
    revokeUserSessions.mockResolvedValue({ success: true });

    const dto = await disableUser({ userId: "user-1" }, { headers });

    expect(banUser).toHaveBeenCalledWith({
      body: { userId: "user-1" },
      headers,
    });
    expect(revokeUserSessions).toHaveBeenCalledWith({
      body: { userId: "user-1" },
      headers,
    });
    expect(dto.banned).toBe(true);
    expect(dto.id).toBe("user-1");
  });

  it("forwards an optional ban reason", async () => {
    banUser.mockResolvedValue({ user: bannedUser });
    revokeUserSessions.mockResolvedValue({ success: true });

    await disableUser({ userId: "user-1", banReason: "left the fund" }, { headers });

    expect(banUser).toHaveBeenCalledWith({
      body: { userId: "user-1", banReason: "left the fund" },
      headers,
    });
  });

  it("records USER_DISABLED with previous value, new value, reason and actor (AC-F23-001)", async () => {
    // This is the scenario AC-F23-001 asks for, verified on an operation that
    // actually exists today: Person/cédula belongs to F04 (ADR-013, section 8).
    banUser.mockResolvedValue({ user: bannedUser });
    revokeUserSessions.mockResolvedValue({ success: true });
    userFindUnique.mockResolvedValue({
      banned: false,
      banReason: null,
      role: "TREASURER",
    });
    sessionCount.mockResolvedValue(3);

    await disableUser(
      { userId: "user-1", banReason: "left the fund" },
      { headers },
    );

    expect(auditCreate).toHaveBeenCalledTimes(1);
    const { data } = auditCreate.mock.calls[0]![0];
    expect(data).toMatchObject({
      actorId: "admin-1",
      actorEmail: "admin@example.com",
      action: "USER_DISABLED",
      entityType: "USER",
      entityId: "user-1",
      reason: "left the fund",
      cashFundId: null,
    });
    expect(data.changes).toEqual({
      banned: { previous: false, next: true },
      banReason: { previous: null, next: "left the fund" },
      // Disabling also revokes every session (BR-F01-004).
      activeSessions: { previous: 3, next: 0 },
    });
  });

  it("does not record an event when the ban itself fails", async () => {
    banUser.mockRejectedValue({ body: { code: "YOU_CANNOT_BAN_YOURSELF" } });

    await expect(disableUser({ userId: "me" }, { headers })).rejects.toBeTruthy();
    expect(auditCreate).not.toHaveBeenCalled();
  });

  it("maps a self-ban attempt to F01_CANNOT_MODIFY_SELF and does not revoke", async () => {
    banUser.mockRejectedValue({ body: { code: "YOU_CANNOT_BAN_YOURSELF" } });

    await expect(
      disableUser({ userId: "me" }, { headers }),
    ).rejects.toMatchObject({ code: F01_ERROR_CODES.CANNOT_MODIFY_SELF });
    expect(revokeUserSessions).not.toHaveBeenCalled();
  });
});
