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
import { createTreasurer } from "./create-treasurer";

const headers = new Headers();
const sampleUser = {
  id: "user-1",
  email: "tess@example.com",
  name: "Tess Treasurer",
  role: "TREASURER",
  banned: false,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-02T00:00:00.000Z"),
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

describe("createTreasurer audit wiring (F23)", () => {
  it("records USER_CREATED as a global event with the acting admin", async () => {
    createUser.mockResolvedValue({ user: sampleUser });

    await createTreasurer(
      { email: "tess@example.com", name: "Tess Treasurer", password: "supersecret" },
      { headers },
    );

    expect(auditCreate).toHaveBeenCalledTimes(1);
    const { data } = auditCreate.mock.calls[0]![0];
    expect(data).toMatchObject({
      actorId: "admin-1",
      actorEmail: "admin@example.com",
      actorRole: "SUPER_ADMIN",
      action: "USER_CREATED",
      entityType: "USER",
      entityId: "user-1",
      // Accounts are global: they belong to no fund (spec edge case).
      cashFundId: null,
    });
  });

  it("never persists the initial password, only that it was set (BR-F23-004)", async () => {
    createUser.mockResolvedValue({ user: sampleUser });

    await createTreasurer(
      { email: "tess@example.com", name: "Tess Treasurer", password: "supersecret" },
      { headers },
    );

    const { data } = auditCreate.mock.calls[0]![0];
    expect(data.changes.password).toEqual({
      previous: null,
      next: "[REDACTED]",
    });
    expect(JSON.stringify(data)).not.toContain("supersecret");
  });

  it("does not record an event when creation is rejected", async () => {
    await expect(
      createTreasurer(
        { email: "not-an-email", name: "x", password: "short" },
        { headers },
      ),
    ).rejects.toBeTruthy();
    expect(auditCreate).not.toHaveBeenCalled();
  });
});

describe("createTreasurer", () => {
  it("creates a TREASURER through the admin API and returns a safe DTO", async () => {
    createUser.mockResolvedValue({ user: sampleUser });

    const dto = await createTreasurer(
      { email: "tess@example.com", name: "Tess Treasurer", password: "supersecret" },
      { headers },
    );

    expect(createUser).toHaveBeenCalledWith({
      body: {
        email: "tess@example.com",
        name: "Tess Treasurer",
        password: "supersecret",
        role: "TREASURER",
      },
      headers,
    });
    expect(dto).toEqual({
      id: "user-1",
      email: "tess@example.com",
      name: "Tess Treasurer",
      role: "TREASURER",
      banned: false,
      createdAt: sampleUser.createdAt,
      updatedAt: sampleUser.updatedAt,
    });
    expect(dto).not.toHaveProperty("password");
  });

  it("rejects invalid input with F01_INVALID_INPUT and never calls the API", async () => {
    await expect(
      createTreasurer({ email: "bad", name: "", password: "x" }, { headers }),
    ).rejects.toMatchObject({ code: F01_ERROR_CODES.INVALID_INPUT });
    expect(createUser).not.toHaveBeenCalled();
  });

  it("maps a duplicate email to F01_EMAIL_TAKEN", async () => {
    createUser.mockRejectedValue({
      body: { code: "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL" },
    });
    await expect(
      createTreasurer(
        { email: "tess@example.com", name: "Tess", password: "supersecret" },
        { headers },
      ),
    ).rejects.toMatchObject({ code: F01_ERROR_CODES.EMAIL_TAKEN });
  });

  it("maps a forbidden caller to F01_UNAUTHORIZED", async () => {
    createUser.mockRejectedValue({
      body: { code: "YOU_ARE_NOT_ALLOWED_TO_CREATE_USERS" },
    });
    await expect(
      createTreasurer(
        { email: "tess@example.com", name: "Tess", password: "supersecret" },
        { headers },
      ),
    ).rejects.toMatchObject({ code: F01_ERROR_CODES.UNAUTHORIZED });
  });
});
