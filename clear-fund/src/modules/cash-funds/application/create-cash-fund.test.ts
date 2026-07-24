import { Decimal } from "decimal.js";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getSession, create, auditCreate } = vi.hoisted(() => ({
  getSession: vi.fn(),
  create: vi.fn(),
  auditCreate: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession } },
  ROLES: { SUPER_ADMIN: "SUPER_ADMIN", TREASURER: "TREASURER" },
}));

vi.mock("@/lib/db", () => {
  const client = {
    cashFund: { create },
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
  auditCreate.mockResolvedValue({ id: "event-1" });
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

  it("records a CASH_FUND_CREATED audit event with the actor (F23, ADR-013)", async () => {
    create.mockResolvedValue(createdRow);

    await createCashFund(validInput, { headers });

    expect(auditCreate).toHaveBeenCalledTimes(1);
    const { data } = auditCreate.mock.calls[0]![0];
    expect(data).toMatchObject({
      actorId: "admin-1",
      actorRole: "SUPER_ADMIN",
      action: "CASH_FUND_CREATED",
      entityType: "CASH_FUND",
      entityId: "fund-1",
      cashFundId: "fund-1",
    });
    // Money reaches the log as a decimal string, never a number.
    expect(data.changes.monthlySavingAmount).toEqual({
      previous: null,
      next: "150",
    });
  });

  it("does not record an audit event when the operation fails", async () => {
    await expect(
      createCashFund({ ...validInput, name: "" }, { headers }),
    ).rejects.toBeTruthy();
    expect(auditCreate).not.toHaveBeenCalled();
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
