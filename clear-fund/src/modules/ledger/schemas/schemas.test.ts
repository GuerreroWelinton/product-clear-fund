import { describe, expect, it } from "vitest";

import {
  LEDGER_PAGE_SIZE_DEFAULT,
  LEDGER_PAGE_SIZE_MAX,
  getCashFundBalanceSchema,
  listCashMovementsSchema,
} from ".";

const CASH_FUND_ID = "b3f1a1f0-4b8a-4f3e-9c8a-0f1a2b3c4d5e";

describe("listCashMovementsSchema", () => {
  it("requires a uuid cashFundId", () => {
    const parsed = listCashMovementsSchema.parse({ cashFundId: CASH_FUND_ID });
    expect(parsed.cashFundId).toBe(CASH_FUND_ID);
  });

  it("rejects a non-uuid cashFundId", () => {
    expect(() =>
      listCashMovementsSchema.parse({ cashFundId: "fund-1" }),
    ).toThrow();
  });

  it("defaults to the first page with the default page size", () => {
    const parsed = listCashMovementsSchema.parse({ cashFundId: CASH_FUND_ID });
    expect(parsed.page).toBe(1);
    expect(parsed.pageSize).toBe(LEDGER_PAGE_SIZE_DEFAULT);
  });

  it("caps the page size so no caller can request the whole ledger", () => {
    expect(() =>
      listCashMovementsSchema.parse({
        cashFundId: CASH_FUND_ID,
        pageSize: LEDGER_PAGE_SIZE_MAX + 1,
      }),
    ).toThrow();
  });

  it("rejects a non-positive page", () => {
    expect(() =>
      listCashMovementsSchema.parse({ cashFundId: CASH_FUND_ID, page: 0 }),
    ).toThrow();
  });

  it("accepts the optional movementType and direction filters", () => {
    const parsed = listCashMovementsSchema.parse({
      cashFundId: CASH_FUND_ID,
      movementType: "SAVINGS_PAYMENT",
      direction: "IN",
    });
    expect(parsed.movementType).toBe("SAVINGS_PAYMENT");
    expect(parsed.direction).toBe("IN");
  });

  it("rejects a direction outside IN/OUT", () => {
    expect(() =>
      listCashMovementsSchema.parse({
        cashFundId: CASH_FUND_ID,
        direction: "SIDEWAYS",
      }),
    ).toThrow();
  });

  it("accepts an ISO date range", () => {
    const parsed = listCashMovementsSchema.parse({
      cashFundId: CASH_FUND_ID,
      fromDate: "2026-01-01",
      toDate: "2026-01-31",
    });
    expect(parsed.fromDate).toBe("2026-01-01");
    expect(parsed.toDate).toBe("2026-01-31");
  });

  it("rejects a malformed date", () => {
    expect(() =>
      listCashMovementsSchema.parse({
        cashFundId: CASH_FUND_ID,
        fromDate: "01-01-2026",
      }),
    ).toThrow();
  });

  it("rejects a fromDate after toDate", () => {
    expect(() =>
      listCashMovementsSchema.parse({
        cashFundId: CASH_FUND_ID,
        fromDate: "2026-02-01",
        toDate: "2026-01-01",
      }),
    ).toThrow();
  });
});

describe("getCashFundBalanceSchema", () => {
  it("requires a uuid cashFundId", () => {
    const parsed = getCashFundBalanceSchema.parse({ cashFundId: CASH_FUND_ID });
    expect(parsed.cashFundId).toBe(CASH_FUND_ID);
  });

  it("rejects a non-uuid cashFundId", () => {
    expect(() =>
      getCashFundBalanceSchema.parse({ cashFundId: "fund-1" }),
    ).toThrow();
  });
});
