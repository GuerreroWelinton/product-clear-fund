import { Decimal } from "decimal.js";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getSession, create } = vi.hoisted(() => ({
  getSession: vi.fn(),
  create: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession } },
  ROLES: { SUPER_ADMIN: "SUPER_ADMIN", TREASURER: "TREASURER" },
}));

vi.mock("@/lib/db", () => ({
  prisma: { cashFund: { create } },
}));

import { F02_ERROR_CODES } from "../domain/errors";
import { createCashFund } from "./create-cash-fund";

const headers = new Headers();
const superAdminSession = { user: { id: "admin-1", role: "SUPER_ADMIN" } };
const treasurerSession = { user: { id: "treasurer-1", role: "TREASURER" } };

const validInput = {
  name: "Caja Los Andes",
  monthlySavingAmount: "150.00",
  recommendedDay: 5,
  maximumDay: 10,
  maxAdvanceMonths: 3,
  riskThreshold: 2,
};

const createdRow = {
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
};

beforeEach(() => {
  vi.clearAllMocks();
  getSession.mockResolvedValue(superAdminSession);
});

describe("createCashFund", () => {
  it("creates a DRAFT cash fund and returns a DTO with money as a string", async () => {
    create.mockResolvedValue(createdRow);

    const dto = await createCashFund(validInput, { headers });

    expect(create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: "Caja Los Andes",
        monthlySavingAmount: "150.00",
        recommendedDay: 5,
        maximumDay: 10,
        maxAdvanceMonths: 3,
        riskThreshold: 2,
      }),
    });
    expect(dto).toMatchObject({
      id: "fund-1",
      status: "DRAFT",
      monthlySavingAmount: "150",
    });
    expect(typeof dto.monthlySavingAmount).toBe("string");
  });

  it("rejects invalid input with F02_INVALID_INPUT and never calls Prisma", async () => {
    await expect(
      createCashFund({ ...validInput, name: "" }, { headers }),
    ).rejects.toMatchObject({ code: F02_ERROR_CODES.INVALID_INPUT });
    expect(create).not.toHaveBeenCalled();
  });

  it("rejects a non-Super-Admin caller with F02_UNAUTHORIZED", async () => {
    getSession.mockResolvedValue(treasurerSession);
    await expect(createCashFund(validInput, { headers })).rejects.toMatchObject(
      { code: F02_ERROR_CODES.UNAUTHORIZED },
    );
    expect(create).not.toHaveBeenCalled();
  });

  it("rejects an invalid day config with F02_INVALID_DAY_CONFIG", async () => {
    await expect(
      createCashFund(
        { ...validInput, recommendedDay: 20, maximumDay: 10 },
        { headers },
      ),
    ).rejects.toMatchObject({ code: F02_ERROR_CODES.INVALID_DAY_CONFIG });
    expect(create).not.toHaveBeenCalled();
  });

  it("rejects a zero monthlySavingAmount with F02_INVALID_INPUT", async () => {
    await expect(
      createCashFund({ ...validInput, monthlySavingAmount: "0" }, { headers }),
    ).rejects.toMatchObject({ code: F02_ERROR_CODES.INVALID_INPUT });
    expect(create).not.toHaveBeenCalled();
  });
});
