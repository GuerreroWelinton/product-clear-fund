import { Decimal } from "decimal.js";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getSession, findMany, listAssignedCashFunds } = vi.hoisted(() => ({
  getSession: vi.fn(),
  findMany: vi.fn(),
  listAssignedCashFunds: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession } },
  ROLES: { SUPER_ADMIN: "SUPER_ADMIN", TREASURER: "TREASURER" },
}));

vi.mock("@/lib/db", () => ({
  prisma: { cashFund: { findMany } },
}));

// Concrete path, matching how cash-funds/application/authorize.ts imports it
// (mirrors the audit module's own cycle-avoidance comment).
vi.mock(
  "@/modules/treasurer-assignments/application/list-assigned-cash-funds",
  () => ({ listAssignedCashFunds }),
);

import { F02_ERROR_CODES } from "../domain/errors";
import { listCashFunds } from "./list-cash-funds";

const headers = new Headers();
const superAdminSession = { user: { id: "admin-1", role: "SUPER_ADMIN" } };
const treasurerSession = { user: { id: "treasurer-1", role: "TREASURER" } };

function makeRow(id: string, name: string) {
  return {
    id,
    name,
    logoKey: null,
    phrase: null,
    currency: "USD",
    monthlySavingAmount: new Decimal("50.00"),
    officialStartDate: null,
    status: "ACTIVE",
    nextMemberNumber: 1,
    recommendedDay: 5,
    maximumDay: 15,
    maxAdvanceMonths: 3,
    riskThreshold: 3,
    activatedAt: null,
    deactivatedAt: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("listCashFunds", () => {
  it("returns every fund for a SUPER_ADMIN, unfiltered", async () => {
    getSession.mockResolvedValue(superAdminSession);
    findMany.mockResolvedValue([
      makeRow("fund-1", "Caja Uno"),
      makeRow("fund-2", "Caja Dos"),
    ]);

    const funds = await listCashFunds({ headers });

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: undefined }),
    );
    expect(listAssignedCashFunds).not.toHaveBeenCalled();
    expect(funds.map((fund) => fund.id)).toEqual(["fund-1", "fund-2"]);
    expect(typeof funds[0]?.monthlySavingAmount).toBe("string");
  });

  it("returns only the treasurer's actively assigned funds", async () => {
    getSession.mockResolvedValue(treasurerSession);
    listAssignedCashFunds.mockResolvedValue(["fund-1"]);
    findMany.mockResolvedValue([makeRow("fund-1", "Caja Uno")]);

    const funds = await listCashFunds({ headers });

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: { in: ["fund-1"] } } }),
    );
    expect(funds.map((fund) => fund.id)).toEqual(["fund-1"]);
  });

  it("returns nothing and leaks no fund name for a treasurer with no active assignment", async () => {
    getSession.mockResolvedValue(treasurerSession);
    listAssignedCashFunds.mockResolvedValue([]);
    findMany.mockResolvedValue([]);

    const funds = await listCashFunds({ headers });

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: { in: [] } } }),
    );
    expect(funds).toEqual([]);
  });

  it("rejects an unauthenticated caller with F02_UNAUTHORIZED and never calls Prisma", async () => {
    getSession.mockResolvedValue(null);

    await expect(listCashFunds({ headers })).rejects.toMatchObject({
      code: F02_ERROR_CODES.UNAUTHORIZED,
    });
    expect(findMany).not.toHaveBeenCalled();
  });
});
