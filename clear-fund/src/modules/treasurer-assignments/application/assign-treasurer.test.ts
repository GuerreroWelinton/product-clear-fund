import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  getSession,
  fundFindUnique,
  userFindUnique,
  assignmentFindUnique,
  assignmentCreate,
  assignmentUpdate,
} = vi.hoisted(() => ({
  getSession: vi.fn(),
  fundFindUnique: vi.fn(),
  userFindUnique: vi.fn(),
  assignmentFindUnique: vi.fn(),
  assignmentCreate: vi.fn(),
  assignmentUpdate: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession } },
  ROLES: { SUPER_ADMIN: "SUPER_ADMIN", TREASURER: "TREASURER" },
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    cashFund: { findUnique: fundFindUnique },
    user: { findUnique: userFindUnique },
    cashFundUser: {
      findUnique: assignmentFindUnique,
      create: assignmentCreate,
      update: assignmentUpdate,
    },
  },
}));

import { F03_ERROR_CODES } from "../domain/errors";
import { assignTreasurer } from "./assign-treasurer";

const headers = new Headers();
const input = { cashFundId: "fund-1", userId: "treasurer-1" };
const row = {
  id: "a1",
  cashFundId: "fund-1",
  userId: "treasurer-1",
  status: "ACTIVE",
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
};

beforeEach(() => {
  vi.clearAllMocks();
  getSession.mockResolvedValue({ user: { id: "admin-1", role: "SUPER_ADMIN" } });
  fundFindUnique.mockResolvedValue({ id: "fund-1" });
  userFindUnique.mockResolvedValue({ id: "treasurer-1", role: "TREASURER" });
});

describe("assignTreasurer", () => {
  it("creates a new ACTIVE assignment when none exists", async () => {
    assignmentFindUnique.mockResolvedValue(null);
    assignmentCreate.mockResolvedValue(row);

    const dto = await assignTreasurer(input, { headers });

    expect(assignmentCreate).toHaveBeenCalledWith({
      data: { cashFundId: "fund-1", userId: "treasurer-1", status: "ACTIVE" },
    });
    expect(dto).toMatchObject({ status: "ACTIVE", userId: "treasurer-1" });
  });

  it("reactivates a revoked assignment instead of creating a duplicate", async () => {
    assignmentFindUnique.mockResolvedValue({ ...row, status: "REVOKED" });
    assignmentUpdate.mockResolvedValue(row);

    await assignTreasurer(input, { headers });

    expect(assignmentUpdate).toHaveBeenCalledWith({
      where: { cashFundId_userId: { cashFundId: "fund-1", userId: "treasurer-1" } },
      data: { status: "ACTIVE" },
    });
    expect(assignmentCreate).not.toHaveBeenCalled();
  });

  it("is a no-op when an ACTIVE assignment already exists (duplicate)", async () => {
    assignmentFindUnique.mockResolvedValue(row);

    const dto = await assignTreasurer(input, { headers });

    expect(assignmentCreate).not.toHaveBeenCalled();
    expect(assignmentUpdate).not.toHaveBeenCalled();
    expect(dto.status).toBe("ACTIVE");
  });

  it("rejects a non-Super-Admin caller with F03_UNAUTHORIZED", async () => {
    getSession.mockResolvedValue({ user: { id: "u2", role: "TREASURER" } });
    await expect(assignTreasurer(input, { headers })).rejects.toMatchObject({
      code: F03_ERROR_CODES.UNAUTHORIZED,
    });
    expect(assignmentCreate).not.toHaveBeenCalled();
  });

  it("rejects when the cash fund does not exist", async () => {
    fundFindUnique.mockResolvedValue(null);
    await expect(assignTreasurer(input, { headers })).rejects.toMatchObject({
      code: F03_ERROR_CODES.CASH_FUND_NOT_FOUND,
    });
  });

  it("rejects when the target user is not a treasurer", async () => {
    userFindUnique.mockResolvedValue({ id: "treasurer-1", role: "SUPER_ADMIN" });
    await expect(assignTreasurer(input, { headers })).rejects.toMatchObject({
      code: F03_ERROR_CODES.NOT_A_TREASURER,
    });
  });

  it("rejects invalid input with F03_INVALID_INPUT and never touches Prisma", async () => {
    await expect(
      assignTreasurer({ cashFundId: "", userId: "u1" }, { headers }),
    ).rejects.toMatchObject({ code: F03_ERROR_CODES.INVALID_INPUT });
    expect(fundFindUnique).not.toHaveBeenCalled();
  });
});
