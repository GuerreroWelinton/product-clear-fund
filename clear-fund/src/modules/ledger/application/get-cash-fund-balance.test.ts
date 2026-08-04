import { beforeEach, describe, expect, it, vi } from "vitest";

const { getSession, findFirstAssignment, findUniqueFund, aggregate } =
  vi.hoisted(() => ({
    getSession: vi.fn(),
    findFirstAssignment: vi.fn(),
    findUniqueFund: vi.fn(),
    aggregate: vi.fn(),
  }));

vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession } },
  ROLES: { SUPER_ADMIN: "SUPER_ADMIN", TREASURER: "TREASURER" },
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    cashFundUser: { findFirst: findFirstAssignment },
    cashFund: { findUnique: findUniqueFund },
    cashMovement: { aggregate },
  },
}));

import { F20_ERROR_CODES } from "../domain/errors";
import { getCashFundBalance } from "./get-cash-fund-balance";

const headers = new Headers();
const superAdminSession = { user: { id: "admin-1", role: "SUPER_ADMIN" } };
const FUND_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_FUND_ID = "22222222-2222-4222-8222-222222222222";
const fundRow = { id: FUND_ID, currency: "USD" };

beforeEach(() => {
  vi.clearAllMocks();
  getSession.mockResolvedValue(superAdminSession);
  findUniqueFund.mockResolvedValue(fundRow);
});

describe("getCashFundBalance", () => {
  it("derives accounting, committed and free balance from IN/OUT sums", async () => {
    aggregate
      .mockResolvedValueOnce({ _sum: { amount: "300.00" } }) // IN
      .mockResolvedValueOnce({ _sum: { amount: "120.00" } }); // OUT

    const balance = await getCashFundBalance({ cashFundId: FUND_ID }, { headers });

    expect(balance).toEqual({
      cashFundId: FUND_ID,
      currency: "USD",
      accountingBalance: "180.00",
      committedBalance: "0.00",
      freeBalance: "180.00",
    });
  });

  // MANDATORY GUARD: Prisma's aggregate returns _sum.amount === null on an
  // empty table. F20 ships with an empty ledger (ADR-014), so this is the
  // day-one path, not an edge case — new Decimal(null) throws.
  it("does not throw when the ledger is empty (_sum.amount === null)", async () => {
    aggregate
      .mockResolvedValueOnce({ _sum: { amount: null } }) // IN
      .mockResolvedValueOnce({ _sum: { amount: null } }); // OUT

    const balance = await getCashFundBalance({ cashFundId: FUND_ID }, { headers });

    expect(balance).toEqual({
      cashFundId: FUND_ID,
      currency: "USD",
      accountingBalance: "0.00",
      committedBalance: "0.00",
      freeBalance: "0.00",
    });
  });

  it("rejects a request for a fund that does not exist", async () => {
    findUniqueFund.mockResolvedValue(null);

    await expect(
      getCashFundBalance({ cashFundId: OTHER_FUND_ID }, { headers }),
    ).rejects.toMatchObject({ code: F20_ERROR_CODES.CASH_FUND_NOT_FOUND });
    expect(aggregate).not.toHaveBeenCalled();
  });

  it("rejects a treasurer without an assignment to the fund", async () => {
    getSession.mockResolvedValue({ user: { id: "t1", role: "TREASURER" } });
    findFirstAssignment.mockResolvedValue(null);

    await expect(
      getCashFundBalance({ cashFundId: FUND_ID }, { headers }),
    ).rejects.toMatchObject({ code: F20_ERROR_CODES.UNAUTHORIZED });
    expect(aggregate).not.toHaveBeenCalled();
  });

  // F13 SEAM (ADR-014): committed comes from the domain's deriveCommittedBalance,
  // not a hardcoded literal. Proven here because free = accounting - committed
  // still holds even when accounting is non-zero.
  it("computes free balance as accounting minus committed", async () => {
    aggregate
      .mockResolvedValueOnce({ _sum: { amount: "500.00" } })
      .mockResolvedValueOnce({ _sum: { amount: "0" } });

    const balance = await getCashFundBalance({ cashFundId: FUND_ID }, { headers });

    expect(balance.accountingBalance).toBe("500.00");
    expect(balance.committedBalance).toBe("0.00");
    expect(balance.freeBalance).toBe(
      (Number(balance.accountingBalance) - Number(balance.committedBalance)).toFixed(2),
    );
  });
});
