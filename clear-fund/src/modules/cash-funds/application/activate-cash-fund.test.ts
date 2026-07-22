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
import { activateCashFund } from "./activate-cash-fund";

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
    status: "DRAFT",
    nextMemberNumber: 1,
    recommendedDay: 5,
    maximumDay: 10,
    maxAdvanceMonths: 3,
    riskThreshold: 2,
    activatedAt: null,
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

describe("activateCashFund", () => {
  it("activates a DRAFT fund and sets activatedAt", async () => {
    findUnique.mockResolvedValue(fundRow());
    update.mockResolvedValue(
      fundRow({ status: "ACTIVE", activatedAt: new Date("2026-02-01T00:00:00.000Z") }),
    );

    const dto = await activateCashFund({ cashFundId: "fund-1" }, { headers });

    expect(update).toHaveBeenCalledWith({
      where: { id: "fund-1" },
      data: expect.objectContaining({ status: "ACTIVE" }),
    });
    expect(dto.status).toBe("ACTIVE");
    expect(dto.activatedAt).not.toBeNull();
  });

  it("reactivates an INACTIVE fund, preserving deactivatedAt (F06 seam)", async () => {
    const deactivatedAt = new Date("2026-01-15T00:00:00.000Z");
    findUnique.mockResolvedValue(fundRow({ status: "INACTIVE", deactivatedAt }));
    update.mockResolvedValue(
      fundRow({
        status: "ACTIVE",
        deactivatedAt,
        activatedAt: new Date("2026-02-01T00:00:00.000Z"),
      }),
    );

    await activateCashFund({ cashFundId: "fund-1" }, { headers });

    expect(update).toHaveBeenCalledTimes(1);
    const callArgs = update.mock.calls[0]?.[0] as { data: object };
    expect(callArgs.data).not.toHaveProperty("deactivatedAt");
  });

  it("rejects invalid input with F02_INVALID_INPUT", async () => {
    await expect(activateCashFund({ cashFundId: "" }, { headers })).rejects.toMatchObject(
      { code: F02_ERROR_CODES.INVALID_INPUT },
    );
    expect(update).not.toHaveBeenCalled();
  });

  it("rejects a non-Super-Admin caller with F02_UNAUTHORIZED", async () => {
    getSession.mockResolvedValue({ user: { id: "t1", role: "TREASURER" } });
    await expect(
      activateCashFund({ cashFundId: "fund-1" }, { headers }),
    ).rejects.toMatchObject({ code: F02_ERROR_CODES.UNAUTHORIZED });
  });

  it("rejects when the fund does not exist", async () => {
    findUnique.mockResolvedValue(null);
    await expect(
      activateCashFund({ cashFundId: "missing" }, { headers }),
    ).rejects.toMatchObject({ code: F02_ERROR_CODES.CASH_FUND_NOT_FOUND });
  });

  it("rejects activating a fund that is already ACTIVE", async () => {
    findUnique.mockResolvedValue(fundRow({ status: "ACTIVE" }));
    await expect(
      activateCashFund({ cashFundId: "fund-1" }, { headers }),
    ).rejects.toMatchObject({ code: F02_ERROR_CODES.INVALID_STATE_TRANSITION });
    expect(update).not.toHaveBeenCalled();
  });

  it("rejects initial activation with an invalid day config", async () => {
    findUnique.mockResolvedValue(
      fundRow({ recommendedDay: 20, maximumDay: 10 }),
    );
    await expect(
      activateCashFund({ cashFundId: "fund-1" }, { headers }),
    ).rejects.toMatchObject({ code: F02_ERROR_CODES.INVALID_DAY_CONFIG });
    expect(update).not.toHaveBeenCalled();
  });
});
