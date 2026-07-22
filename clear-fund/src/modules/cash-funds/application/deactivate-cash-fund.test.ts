import { Decimal } from "decimal.js";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getSession, findUnique, update } = vi.hoisted(() => ({
  getSession: vi.fn(),
  findUnique: vi.fn(),
  update: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession } },
  ROLES: { SUPER_ADMIN: "SUPER_ADMIN", TREASURER: "TREASURER" },
}));

vi.mock("@/lib/db", () => ({
  prisma: { cashFund: { findUnique, update } },
}));

import { F02_ERROR_CODES } from "../domain/errors";
import { deactivateCashFund } from "./deactivate-cash-fund";

const headers = new Headers();
const superAdminSession = { user: { id: "admin-1", role: "SUPER_ADMIN" } };

function fundRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "fund-1",
    name: "Caja Los Andes",
    logoKey: null,
    phrase: null,
    currency: "USD",
    monthlySavingAmount: new Decimal("150.00"),
    officialStartDate: null,
    status: "ACTIVE",
    nextMemberNumber: 1,
    recommendedDay: 5,
    maximumDay: 10,
    maxAdvanceMonths: 3,
    riskThreshold: 2,
    activatedAt: new Date("2026-01-01T00:00:00.000Z"),
    deactivatedAt: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  getSession.mockResolvedValue(superAdminSession);
});

describe("deactivateCashFund", () => {
  it("deactivates an ACTIVE fund and sets deactivatedAt", async () => {
    findUnique.mockResolvedValue(fundRow());
    update.mockResolvedValue(
      fundRow({
        status: "INACTIVE",
        deactivatedAt: new Date("2026-02-01T00:00:00.000Z"),
      }),
    );

    const dto = await deactivateCashFund({ cashFundId: "fund-1" }, { headers });

    expect(update).toHaveBeenCalledWith({
      where: { id: "fund-1" },
      data: expect.objectContaining({ status: "INACTIVE" }),
    });
    expect(dto.status).toBe("INACTIVE");
    expect(dto.deactivatedAt).not.toBeNull();
  });

  it("rejects invalid input with F02_INVALID_INPUT", async () => {
    await expect(
      deactivateCashFund({ cashFundId: "" }, { headers }),
    ).rejects.toMatchObject({ code: F02_ERROR_CODES.INVALID_INPUT });
    expect(update).not.toHaveBeenCalled();
  });

  it("rejects a non-Super-Admin caller with F02_UNAUTHORIZED", async () => {
    getSession.mockResolvedValue({ user: { id: "t1", role: "TREASURER" } });
    await expect(
      deactivateCashFund({ cashFundId: "fund-1" }, { headers }),
    ).rejects.toMatchObject({ code: F02_ERROR_CODES.UNAUTHORIZED });
  });

  it("rejects when the fund does not exist", async () => {
    findUnique.mockResolvedValue(null);
    await expect(
      deactivateCashFund({ cashFundId: "missing" }, { headers }),
    ).rejects.toMatchObject({ code: F02_ERROR_CODES.CASH_FUND_NOT_FOUND });
  });

  it("rejects deactivating a DRAFT fund", async () => {
    findUnique.mockResolvedValue(fundRow({ status: "DRAFT" }));
    await expect(
      deactivateCashFund({ cashFundId: "fund-1" }, { headers }),
    ).rejects.toMatchObject({ code: F02_ERROR_CODES.INVALID_STATE_TRANSITION });
    expect(update).not.toHaveBeenCalled();
  });

  it("rejects deactivating an already INACTIVE fund", async () => {
    findUnique.mockResolvedValue(fundRow({ status: "INACTIVE" }));
    await expect(
      deactivateCashFund({ cashFundId: "fund-1" }, { headers }),
    ).rejects.toMatchObject({ code: F02_ERROR_CODES.INVALID_STATE_TRANSITION });
    expect(update).not.toHaveBeenCalled();
  });
});
