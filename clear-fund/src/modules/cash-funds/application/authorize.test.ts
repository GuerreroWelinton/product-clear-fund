import { beforeEach, describe, expect, it, vi } from "vitest";

const { getSession, findFirst } = vi.hoisted(() => ({
  getSession: vi.fn(),
  findFirst: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession } },
  ROLES: { SUPER_ADMIN: "SUPER_ADMIN", TREASURER: "TREASURER" },
}));

vi.mock("@/lib/db", () => ({
  prisma: { cashFundUser: { findFirst } },
}));

import { F02_ERROR_CODES } from "../domain/errors";
import { requireSuperAdmin, requireSuperAdminOrAssignedTreasurer } from "./authorize";

const headers = new Headers();

beforeEach(() => {
  vi.clearAllMocks();
});

describe("requireSuperAdmin", () => {
  it("resolves when the caller is a SUPER_ADMIN", async () => {
    getSession.mockResolvedValue({ user: { id: "u1", role: "SUPER_ADMIN" } });
    await expect(requireSuperAdmin({ headers })).resolves.toMatchObject({
      user: { role: "SUPER_ADMIN" },
    });
  });

  it("rejects with F02_UNAUTHORIZED when the caller is a TREASURER", async () => {
    getSession.mockResolvedValue({ user: { id: "u2", role: "TREASURER" } });
    await expect(requireSuperAdmin({ headers })).rejects.toMatchObject({
      code: F02_ERROR_CODES.UNAUTHORIZED,
    });
  });

  it("rejects with F02_UNAUTHORIZED when there is no session", async () => {
    getSession.mockResolvedValue(null);
    await expect(requireSuperAdmin({ headers })).rejects.toMatchObject({
      code: F02_ERROR_CODES.UNAUTHORIZED,
    });
  });
});

describe("requireSuperAdminOrAssignedTreasurer", () => {
  it("resolves for a SUPER_ADMIN without checking assignments", async () => {
    getSession.mockResolvedValue({ user: { id: "u1", role: "SUPER_ADMIN" } });
    await expect(
      requireSuperAdminOrAssignedTreasurer({ headers }, "fund-1"),
    ).resolves.toBeTruthy();
    expect(findFirst).not.toHaveBeenCalled();
  });

  it("resolves for a treasurer with an ACTIVE assignment to the fund", async () => {
    getSession.mockResolvedValue({ user: { id: "u2", role: "TREASURER" } });
    findFirst.mockResolvedValue({ id: "assignment-1" });
    await expect(
      requireSuperAdminOrAssignedTreasurer({ headers }, "fund-1"),
    ).resolves.toBeTruthy();
    expect(findFirst).toHaveBeenCalledWith({
      where: { cashFundId: "fund-1", userId: "u2", status: "ACTIVE" },
    });
  });

  it("rejects with F02_UNAUTHORIZED for a treasurer without an assignment", async () => {
    getSession.mockResolvedValue({ user: { id: "u2", role: "TREASURER" } });
    findFirst.mockResolvedValue(null);
    await expect(
      requireSuperAdminOrAssignedTreasurer({ headers }, "fund-1"),
    ).rejects.toMatchObject({ code: F02_ERROR_CODES.UNAUTHORIZED });
  });

  it("rejects with F02_UNAUTHORIZED when there is no session", async () => {
    getSession.mockResolvedValue(null);
    await expect(
      requireSuperAdminOrAssignedTreasurer({ headers }, "fund-1"),
    ).rejects.toMatchObject({ code: F02_ERROR_CODES.UNAUTHORIZED });
  });
});
