import { Decimal } from "decimal.js";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getSession, findUnique, update, auditCreate } = vi.hoisted(() => ({
  getSession: vi.fn(),
  findUnique: vi.fn(),
  update: vi.fn(),
  auditCreate: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession } },
  ROLES: { SUPER_ADMIN: "SUPER_ADMIN", TREASURER: "TREASURER" },
}));

vi.mock("@/lib/db", () => {
  const client = {
    cashFund: { findUnique, update },
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

import { F02_ERROR_CODES } from "../domain/errors";
import { updateCashFundDraft } from "./update-cash-fund-draft";

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
  auditCreate.mockResolvedValue({ id: "event-1" });
});

describe("updateCashFundDraft", () => {
  it("updates a DRAFT fund's name and fixed fee", async () => {
    findUnique.mockResolvedValue(fundRow());
    update.mockResolvedValue(
      fundRow({ name: "Caja Renovada", monthlySavingAmount: new Decimal("200.00") }),
    );

    const dto = await updateCashFundDraft(
      { cashFundId: "fund-1", name: "Caja Renovada", monthlySavingAmount: "200.00" },
      { headers },
    );

    expect(update).toHaveBeenCalledWith({
      where: { id: "fund-1" },
      data: expect.objectContaining({
        name: "Caja Renovada",
        monthlySavingAmount: "200.00",
      }),
    });
    expect(dto.name).toBe("Caja Renovada");
    expect(dto.monthlySavingAmount).toBe("200");
  });

  it("updates a DRAFT fund's operational config (maxAdvanceMonths, riskThreshold)", async () => {
    findUnique.mockResolvedValue(fundRow());
    update.mockResolvedValue(fundRow({ maxAdvanceMonths: 6, riskThreshold: 4 }));

    const dto = await updateCashFundDraft(
      { cashFundId: "fund-1", maxAdvanceMonths: 6, riskThreshold: 4 },
      { headers },
    );

    expect(update).toHaveBeenCalledWith({
      where: { id: "fund-1" },
      data: expect.objectContaining({ maxAdvanceMonths: 6, riskThreshold: 4 }),
    });
    expect(dto.maxAdvanceMonths).toBe(6);
    expect(dto.riskThreshold).toBe(4);
  });

  it("records CASH_FUND_DRAFT_UPDATED with money as a decimal string (F23)", async () => {
    findUnique.mockResolvedValue(fundRow());
    update.mockResolvedValue(
      fundRow({ name: "Caja Renovada", monthlySavingAmount: new Decimal("200.00") }),
    );

    await updateCashFundDraft(
      { cashFundId: "fund-1", name: "Caja Renovada", monthlySavingAmount: "200.00" },
      { headers },
    );

    expect(auditCreate).toHaveBeenCalledTimes(1);
    const { data } = auditCreate.mock.calls[0]![0];
    expect(data.action).toBe("CASH_FUND_DRAFT_UPDATED");
    expect(data.changes).toEqual({
      name: { previous: "Caja Los Andes", next: "Caja Renovada" },
      monthlySavingAmount: { previous: "150", next: "200" },
    });
  });

  it("rejects invalid input with F02_INVALID_INPUT", async () => {
    await expect(
      updateCashFundDraft({ cashFundId: "" }, { headers }),
    ).rejects.toMatchObject({ code: F02_ERROR_CODES.INVALID_INPUT });
    expect(update).not.toHaveBeenCalled();
    expect(auditCreate).not.toHaveBeenCalled();
  });

  it("rejects a non-Super-Admin caller with F02_UNAUTHORIZED", async () => {
    getSession.mockResolvedValue({ user: { id: "t1", role: "TREASURER" } });
    await expect(
      updateCashFundDraft({ cashFundId: "fund-1", name: "x" }, { headers }),
    ).rejects.toMatchObject({ code: F02_ERROR_CODES.UNAUTHORIZED });
    expect(update).not.toHaveBeenCalled();
  });

  it("rejects when the fund does not exist", async () => {
    findUnique.mockResolvedValue(null);
    await expect(
      updateCashFundDraft({ cashFundId: "missing", name: "x" }, { headers }),
    ).rejects.toMatchObject({ code: F02_ERROR_CODES.CASH_FUND_NOT_FOUND });
  });

  it("rejects editing the fixed fee once the fund is no longer DRAFT", async () => {
    findUnique.mockResolvedValue(fundRow({ status: "ACTIVE" }));
    await expect(
      updateCashFundDraft(
        { cashFundId: "fund-1", monthlySavingAmount: "999.00" },
        { headers },
      ),
    ).rejects.toMatchObject({
      code: F02_ERROR_CODES.CASH_FUND_FIXED_FEE_LOCKED,
    });
    expect(update).not.toHaveBeenCalled();
  });

  it("rejects any draft edit once the fund is no longer DRAFT", async () => {
    findUnique.mockResolvedValue(fundRow({ status: "ACTIVE" }));
    await expect(
      updateCashFundDraft({ cashFundId: "fund-1", name: "x" }, { headers }),
    ).rejects.toMatchObject({
      code: F02_ERROR_CODES.INVALID_STATE_TRANSITION,
    });
    expect(update).not.toHaveBeenCalled();
  });

  it("rejects an invalid merged day config", async () => {
    findUnique.mockResolvedValue(fundRow({ recommendedDay: 5, maximumDay: 10 }));
    await expect(
      updateCashFundDraft(
        { cashFundId: "fund-1", recommendedDay: 20 },
        { headers },
      ),
    ).rejects.toMatchObject({ code: F02_ERROR_CODES.INVALID_DAY_CONFIG });
    expect(update).not.toHaveBeenCalled();
  });
});
