import { describe, expect, it } from "vitest";

import { F20_ERROR_CODES } from "./errors";
import {
  assertSufficientBalance,
  deriveAccountingBalance,
  deriveCommittedBalance,
  deriveFreeBalance,
} from "./balance";

describe("deriveAccountingBalance", () => {
  it("subtracts total out from total in (FINANCIAL_FORMULAS.md)", () => {
    expect(
      deriveAccountingBalance({ totalIn: "1000.00", totalOut: "300.00" }),
    ).toBe("700.00");
  });

  it("returns 0.00 for an empty ledger", () => {
    expect(deriveAccountingBalance({ totalIn: "0", totalOut: "0" })).toBe(
      "0.00",
    );
  });

  it("normalizes the result to exactly 2 decimals", () => {
    expect(deriveAccountingBalance({ totalIn: "10", totalOut: "3.5" })).toBe(
      "6.50",
    );
  });
});

describe("deriveCommittedBalance", () => {
  // F13 SEAM (ADR-014): no caller can supply a non-empty array today, but the
  // sum must be implemented for real, not hardcoded.
  it("returns 0.00 when there are no loans in progress", () => {
    expect(deriveCommittedBalance([])).toBe("0.00");
  });

  it("sums the principal of every loan in progress", () => {
    expect(
      deriveCommittedBalance([
        { principalAmount: "500.00" },
        { principalAmount: "250.25" },
      ]),
    ).toBe("750.25");
  });
});

describe("deriveFreeBalance", () => {
  it("subtracts committed from accounting", () => {
    expect(
      deriveFreeBalance({ accountingBalance: "700.00", committedBalance: "200.00" }),
    ).toBe("500.00");
  });

  // Pure half of AC-F20-002: committed balance reduces free but never touches
  // accounting (accounting is derived only from confirmed movements).
  it("committed balance reduces free but never the accounting figure itself", () => {
    const accountingBalance = deriveAccountingBalance({
      totalIn: "1000.00",
      totalOut: "0",
    });
    const committedBalance = deriveCommittedBalance([
      { principalAmount: "400.00" },
    ]);
    const freeBalance = deriveFreeBalance({ accountingBalance, committedBalance });

    expect(accountingBalance).toBe("1000.00");
    expect(freeBalance).toBe("600.00");
  });

  it("allows a negative free balance to be represented (caller decides what to do with it)", () => {
    expect(
      deriveFreeBalance({ accountingBalance: "100.00", committedBalance: "150.00" }),
    ).toBe("-50.00");
  });
});

describe("assertSufficientBalance", () => {
  // Pure half of AC-F20-003 / BR-F20-008: the disbursement seam F14 will call
  // this before letting a loan draw down the free balance.
  it("passes when the amount exactly equals the free balance", () => {
    expect(() =>
      assertSufficientBalance({ freeBalance: "500.00", amount: "500.00" }),
    ).not.toThrow();
  });

  it("throws F20_INSUFFICIENT_BALANCE when the amount is one cent over", () => {
    expect(() =>
      assertSufficientBalance({ freeBalance: "500.00", amount: "500.01" }),
    ).toThrow(
      expect.objectContaining({ code: F20_ERROR_CODES.INSUFFICIENT_BALANCE }),
    );
  });

  it("passes when the amount is well under the free balance", () => {
    expect(() =>
      assertSufficientBalance({ freeBalance: "500.00", amount: "1.00" }),
    ).not.toThrow();
  });

  // Large values proving decimal.js is used end to end, not JS number math
  // (TECHNICAL_CONVENTIONS.md): 0.1 + 0.2 !== 0.3 in floating point.
  it("does not drift on large decimal values", () => {
    expect(
      deriveAccountingBalance({
        totalIn: "999999999999.99",
        totalOut: "0.01",
      }),
    ).toBe("999999999999.98");

    expect(() =>
      assertSufficientBalance({
        freeBalance: "999999999999.98",
        amount: "999999999999.99",
      }),
    ).toThrow(
      expect.objectContaining({ code: F20_ERROR_CODES.INSUFFICIENT_BALANCE }),
    );
  });
});
