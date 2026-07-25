import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  getSession,
  fundFindUnique,
  userFindUnique,
  assignmentFindUnique,
  assignmentCreate,
  assignmentUpdate,
  auditCreate,
} = vi.hoisted(() => ({
  getSession: vi.fn(),
  fundFindUnique: vi.fn(),
  userFindUnique: vi.fn(),
  assignmentFindUnique: vi.fn(),
  assignmentCreate: vi.fn(),
  assignmentUpdate: vi.fn(),
  auditCreate: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession } },
  ROLES: { SUPER_ADMIN: "SUPER_ADMIN", TREASURER: "TREASURER" },
}));

vi.mock("@/lib/db", () => {
  const client = {
    cashFund: { findUnique: fundFindUnique },
    user: { findUnique: userFindUnique },
    cashFundUser: {
      findUnique: assignmentFindUnique,
      create: assignmentCreate,
      update: assignmentUpdate,
    },
    auditEvent: { create: auditCreate },
  };
  return {
    // $transaction runs the callback against the same mock client, so the F23
    // audit write performed inside the transaction is observable here.
    prisma: {
      ...client,
      $transaction: (fn: (tx: typeof client) => unknown) => fn(client),
    },
  };
});

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
  auditCreate.mockResolvedValue({ id: "event-1" });
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

  it("records TREASURER_ASSIGNED on a first-time assignment (F23)", async () => {
    assignmentFindUnique.mockResolvedValue(null);
    assignmentCreate.mockResolvedValue(row);

    await assignTreasurer(input, { headers });

    expect(auditCreate).toHaveBeenCalledTimes(1);
    const { data } = auditCreate.mock.calls[0]![0];
    expect(data).toMatchObject({
      actorId: "admin-1",
      actorRole: "SUPER_ADMIN",
      action: "TREASURER_ASSIGNED",
      entityType: "CASH_FUND_USER",
      entityId: "a1",
      cashFundId: "fund-1",
    });
    expect(data.changes).toEqual({
      cashFundId: { previous: null, next: "fund-1" },
      userId: { previous: null, next: "treasurer-1" },
      status: { previous: null, next: "ACTIVE" },
    });
  });

  it("records TREASURER_ASSIGNED on a reactivation with the status transition", async () => {
    assignmentFindUnique.mockResolvedValue({ ...row, status: "REVOKED" });
    assignmentUpdate.mockResolvedValue(row);

    await assignTreasurer(input, { headers });

    expect(auditCreate).toHaveBeenCalledTimes(1);
    expect(auditCreate.mock.calls[0]![0].data.changes).toEqual({
      status: { previous: "REVOKED", next: "ACTIVE" },
    });
  });

  it("is a no-op when an ACTIVE assignment already exists (duplicate)", async () => {
    assignmentFindUnique.mockResolvedValue(row);

    const dto = await assignTreasurer(input, { headers });

    expect(assignmentCreate).not.toHaveBeenCalled();
    expect(assignmentUpdate).not.toHaveBeenCalled();
    expect(dto.status).toBe("ACTIVE");
    // A no-op changed nothing, so it must not appear in the log (ADR-013).
    expect(auditCreate).not.toHaveBeenCalled();
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
