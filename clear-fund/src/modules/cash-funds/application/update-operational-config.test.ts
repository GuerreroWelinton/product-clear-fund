import { Decimal } from "decimal.js";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getSession, findFirst, findUnique, update } = vi.hoisted(() => ({
  getSession: vi.fn(),
  findFirst: vi.fn(),
  findUnique: vi.fn(),
  update: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession } },
  ROLES: { SUPER_ADMIN: "SUPER_ADMIN", TREASURER: "TREASURER" },
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    cashFund: { findUnique, update },
    cashFundUser: { findFirst },
  },
}));

import { F02_ERROR_CODES } from "../domain/errors";
import { updateOperationalConfig } from "./update-operational-config";

const headers = new Headers();
const superAdminSession = { user: { id: "admin-1", role: "SUPER_ADMIN" } };
const treasurerSession = { user: { id: "treasurer-1", role: "TREASURER" } };

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

describe("updateOperationalConfig", () => {
  it("lets a Super Admin update the operational config of an ACTIVE fund", async () => {
    findUnique.mockResolvedValue(fundRow());
    update.mockResolvedValue(fundRow({ recommendedDay: 7, maximumDay: 15 }));

    const dto = await updateOperationalConfig(
      { cashFundId: "fund-1", recommendedDay: 7, maximumDay: 15 },
      { headers },
    );

    expect(update).toHaveBeenCalledWith({
      where: { id: "fund-1" },
      data: {
        recommendedDay: 7,
        maximumDay: 15,
        maxAdvanceMonths: 3,
        riskThreshold: 2,
      },
    });
    expect(dto.recommendedDay).toBe(7);
  });

  it("lets an assigned treasurer update the operational config", async () => {
    getSession.mockResolvedValue(treasurerSession);
    findFirst.mockResolvedValue({ id: "assignment-1" });
    findUnique.mockResolvedValue(fundRow());
    update.mockResolvedValue(fundRow({ riskThreshold: 4 }));

    await updateOperationalConfig(
      { cashFundId: "fund-1", riskThreshold: 4 },
      { headers },
    );

    expect(findFirst).toHaveBeenCalledWith({
      where: { cashFundId: "fund-1", userId: "treasurer-1", status: "ACTIVE" },
    });
    expect(update).toHaveBeenCalled();
  });

  it("rejects an unassigned treasurer with F02_UNAUTHORIZED", async () => {
    getSession.mockResolvedValue(treasurerSession);
    findFirst.mockResolvedValue(null);

    await expect(
      updateOperationalConfig(
        { cashFundId: "fund-1", riskThreshold: 4 },
        { headers },
      ),
    ).rejects.toMatchObject({ code: F02_ERROR_CODES.UNAUTHORIZED });
    expect(update).not.toHaveBeenCalled();
  });

  it("rejects invalid input with F02_INVALID_INPUT", async () => {
    await expect(
      updateOperationalConfig({ cashFundId: "" }, { headers }),
    ).rejects.toMatchObject({ code: F02_ERROR_CODES.INVALID_INPUT });
    expect(update).not.toHaveBeenCalled();
  });

  it("rejects when the fund does not exist", async () => {
    findUnique.mockResolvedValue(null);
    await expect(
      updateOperationalConfig({ cashFundId: "missing" }, { headers }),
    ).rejects.toMatchObject({ code: F02_ERROR_CODES.CASH_FUND_NOT_FOUND });
  });

  it("rejects editing operational config while the fund is INACTIVE", async () => {
    findUnique.mockResolvedValue(fundRow({ status: "INACTIVE" }));
    await expect(
      updateOperationalConfig(
        { cashFundId: "fund-1", riskThreshold: 4 },
        { headers },
      ),
    ).rejects.toMatchObject({ code: F02_ERROR_CODES.CASH_FUND_INACTIVE });
    expect(update).not.toHaveBeenCalled();
  });

  it("rejects editing operational config while the fund is DRAFT", async () => {
    findUnique.mockResolvedValue(fundRow({ status: "DRAFT" }));
    await expect(
      updateOperationalConfig(
        { cashFundId: "fund-1", riskThreshold: 4 },
        { headers },
      ),
    ).rejects.toMatchObject({ code: F02_ERROR_CODES.CASH_FUND_INACTIVE });
    expect(update).not.toHaveBeenCalled();
  });

  it("rejects an invalid merged day config", async () => {
    findUnique.mockResolvedValue(fundRow({ recommendedDay: 5, maximumDay: 10 }));
    await expect(
      updateOperationalConfig(
        { cashFundId: "fund-1", maximumDay: 3 },
        { headers },
      ),
    ).rejects.toMatchObject({ code: F02_ERROR_CODES.INVALID_DAY_CONFIG });
    expect(update).not.toHaveBeenCalled();
  });
});
