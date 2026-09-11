import { beforeEach, describe, expect, it, vi } from "vitest";

const { getSession, findFirstAssignment, findUniqueFund } = vi.hoisted(() => ({
  getSession: vi.fn(),
  findFirstAssignment: vi.fn(),
  findUniqueFund: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession } },
  ROLES: { SUPER_ADMIN: "SUPER_ADMIN", TREASURER: "TREASURER" },
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    cashFundUser: { findFirst: findFirstAssignment },
    cashFund: { findUnique: findUniqueFund },
  },
}));

import { F20_ERROR_CODES } from "../domain/errors";
import { getCashFundHeader } from "./get-cash-fund-header";

const headers = new Headers();
const superAdminSession = { user: { id: "admin-1", role: "SUPER_ADMIN" } };
const FUND_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_FUND_ID = "22222222-2222-4222-8222-222222222222";
const fundRow = { id: FUND_ID, name: "Caja Uno" };

beforeEach(() => {
  vi.clearAllMocks();
  getSession.mockResolvedValue(superAdminSession);
  findUniqueFund.mockResolvedValue(fundRow);
});

describe("getCashFundHeader", () => {
  it("returns the fund name for a SUPER_ADMIN", async () => {
    const header = await getCashFundHeader({ cashFundId: FUND_ID }, { headers });

    expect(header).toEqual({ cashFundId: FUND_ID, name: "Caja Uno" });
  });

  it("returns the fund name for a treasurer with an ACTIVE assignment to that fund", async () => {
    getSession.mockResolvedValue({ user: { id: "t1", role: "TREASURER" } });
    findFirstAssignment.mockResolvedValue({ id: "assignment-1" });

    const header = await getCashFundHeader({ cashFundId: FUND_ID }, { headers });

    expect(header).toEqual({ cashFundId: FUND_ID, name: "Caja Uno" });
    expect(findFirstAssignment).toHaveBeenCalledWith({
      where: { cashFundId: FUND_ID, userId: "t1", status: "ACTIVE" },
    });
  });

  // MANDATORY GUARD (F20 manual validation): a treasurer with no active
  // assignment to this fund must be rejected BEFORE the fund is read, so its
  // name is never disclosed to a caller who cannot see it.
  it("rejects a treasurer with no active assignment and never reads the fund", async () => {
    getSession.mockResolvedValue({ user: { id: "t1", role: "TREASURER" } });
    findFirstAssignment.mockResolvedValue(null);

    await expect(
      getCashFundHeader({ cashFundId: FUND_ID }, { headers }),
    ).rejects.toMatchObject({ code: F20_ERROR_CODES.UNAUTHORIZED });
    expect(findUniqueFund).not.toHaveBeenCalled();
  });

  it("rejects an unauthenticated caller with F20_UNAUTHORIZED", async () => {
    getSession.mockResolvedValue(null);

    await expect(
      getCashFundHeader({ cashFundId: FUND_ID }, { headers }),
    ).rejects.toMatchObject({ code: F20_ERROR_CODES.UNAUTHORIZED });
    expect(findUniqueFund).not.toHaveBeenCalled();
  });

  it("rejects a request for a fund that does not exist", async () => {
    findUniqueFund.mockResolvedValue(null);

    await expect(
      getCashFundHeader({ cashFundId: OTHER_FUND_ID }, { headers }),
    ).rejects.toMatchObject({ code: F20_ERROR_CODES.CASH_FUND_NOT_FOUND });
  });

  it("rejects invalid input with F20_INVALID_INPUT", async () => {
    await expect(
      getCashFundHeader({ cashFundId: "not-a-uuid" }, { headers }),
    ).rejects.toMatchObject({ code: F20_ERROR_CODES.INVALID_INPUT });
    expect(getSession).not.toHaveBeenCalled();
  });
});
