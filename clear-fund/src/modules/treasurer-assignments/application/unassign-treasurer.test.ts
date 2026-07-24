import { beforeEach, describe, expect, it, vi } from "vitest";

const { getSession, assignmentFindUnique, assignmentUpdate, auditCreate } =
  vi.hoisted(() => ({
    getSession: vi.fn(),
    assignmentFindUnique: vi.fn(),
    assignmentUpdate: vi.fn(),
    auditCreate: vi.fn(),
  }));

vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession } },
  ROLES: { SUPER_ADMIN: "SUPER_ADMIN", TREASURER: "TREASURER" },
}));

vi.mock("@/lib/db", () => {
  const client = {
    cashFundUser: {
      findUnique: assignmentFindUnique,
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
import { unassignTreasurer } from "./unassign-treasurer";

const headers = new Headers();
const input = { cashFundId: "fund-1", userId: "treasurer-1" };
const activeRow = {
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
  auditCreate.mockResolvedValue({ id: "event-1" });
});

describe("unassignTreasurer", () => {
  it("revokes an active assignment (soft-delete, keeps the row)", async () => {
    assignmentFindUnique.mockResolvedValue(activeRow);
    assignmentUpdate.mockResolvedValue({ ...activeRow, status: "REVOKED" });

    const dto = await unassignTreasurer(input, { headers });

    expect(assignmentUpdate).toHaveBeenCalledWith({
      where: { cashFundId_userId: { cashFundId: "fund-1", userId: "treasurer-1" } },
      data: { status: "REVOKED" },
    });
    expect(dto.status).toBe("REVOKED");
  });

  it("records TREASURER_UNASSIGNED with the status transition (F23)", async () => {
    assignmentFindUnique.mockResolvedValue(activeRow);
    assignmentUpdate.mockResolvedValue({ ...activeRow, status: "REVOKED" });

    await unassignTreasurer(input, { headers });

    expect(auditCreate).toHaveBeenCalledTimes(1);
    const { data } = auditCreate.mock.calls[0]![0];
    expect(data).toMatchObject({
      actorId: "admin-1",
      action: "TREASURER_UNASSIGNED",
      entityType: "CASH_FUND_USER",
      entityId: "a1",
      cashFundId: "fund-1",
    });
    expect(data.changes).toEqual({
      status: { previous: "ACTIVE", next: "REVOKED" },
    });
  });

  it("is a no-op when the assignment is already revoked", async () => {
    assignmentFindUnique.mockResolvedValue({ ...activeRow, status: "REVOKED" });

    const dto = await unassignTreasurer(input, { headers });

    expect(assignmentUpdate).not.toHaveBeenCalled();
    expect(dto.status).toBe("REVOKED");
    // A no-op changed nothing, so it must not appear in the log (ADR-013).
    expect(auditCreate).not.toHaveBeenCalled();
  });

  it("rejects when the assignment does not exist", async () => {
    assignmentFindUnique.mockResolvedValue(null);
    await expect(unassignTreasurer(input, { headers })).rejects.toMatchObject({
      code: F03_ERROR_CODES.ASSIGNMENT_NOT_FOUND,
    });
  });

  it("rejects a non-Super-Admin caller with F03_UNAUTHORIZED", async () => {
    getSession.mockResolvedValue({ user: { id: "u2", role: "TREASURER" } });
    await expect(unassignTreasurer(input, { headers })).rejects.toMatchObject({
      code: F03_ERROR_CODES.UNAUTHORIZED,
    });
    expect(assignmentUpdate).not.toHaveBeenCalled();
  });
});
