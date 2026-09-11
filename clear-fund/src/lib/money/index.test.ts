import { Decimal } from "decimal.js";
import { describe, expect, it } from "vitest";

import { formatMoneyDisplay, MONEY_PATTERN, toMoneyString } from "./index";

describe("MONEY_PATTERN", () => {
  it("accepts an integer or up-to-two-decimal amount", () => {
    expect(MONEY_PATTERN.test("50")).toBe(true);
    expect(MONEY_PATTERN.test("50.5")).toBe(true);
    expect(MONEY_PATTERN.test("50.00")).toBe(true);
  });

  it("rejects more than two decimals or a non-numeric string", () => {
    expect(MONEY_PATTERN.test("50.123")).toBe(false);
    expect(MONEY_PATTERN.test("abc")).toBe(false);
    expect(MONEY_PATTERN.test("-10.00")).toBe(false);
  });
});

describe("toMoneyString", () => {
  it("pads a whole-number string to two decimals (finding 3)", () => {
    expect(toMoneyString("50")).toBe("50.00");
  });

  it("pads a Decimal instance that dropped its trailing zero", () => {
    // decimal.js's own toString() would give "50", exactly the defect this
    // module fixes.
    expect(toMoneyString(new Decimal("50.00"))).toBe("50.00");
  });

  it("keeps an already two-decimal string unchanged", () => {
    expect(toMoneyString("150.50")).toBe("150.50");
  });

  it("rounds a Decimal-like value with more than two decimals half-up", () => {
    expect(toMoneyString(new Decimal("1.005"))).toBe("1.01");
    expect(toMoneyString(new Decimal("2.675"))).toBe("2.68");
  });

  it("rounds a raw string with more than two decimals half-up, without the Number() float bug", () => {
    // Number("1.005").toFixed(2) === "1.00" in plain JS (float drift) — this
    // module must not reproduce that.
    expect(toMoneyString("1.005")).toBe("1.01");
  });

  it("accepts a number", () => {
    expect(toMoneyString(50)).toBe("50.00");
  });

  it("accepts anything Decimal-like via toFixed, e.g. a Prisma Decimal stand-in", () => {
    const prismaDecimalLike = { toFixed: (dp?: number) => (50).toFixed(dp) };
    expect(toMoneyString(prismaDecimalLike)).toBe("50.00");
  });

  it("keeps large values exact (no float precision loss)", () => {
    expect(toMoneyString("999999999999.98")).toBe("999999999999.98");
  });

  it("normalizes zero", () => {
    expect(toMoneyString("0")).toBe("0.00");
  });
});

describe("formatMoneyDisplay", () => {
  it("formats USD with the es-EC currency symbol and grouping", () => {
    expect(formatMoneyDisplay("1234.5", "USD")).toBe("$1.234,50");
  });

  it("rounds USD to two decimals via Decimal before formatting", () => {
    // Exercises the same "1.005" float-drift case as toMoneyString, but
    // through the display path: Number("1.005").toFixed(2) would give
    // "1.00", not "1.01".
    expect(formatMoneyDisplay("1.005", "USD")).toBe("$1,01");
  });

  it('renders a non-USD currency as "<amount> <currency>"', () => {
    expect(formatMoneyDisplay("50", "EUR")).toBe("50.00 EUR");
  });

  it("rounds a non-USD amount to two decimals", () => {
    expect(formatMoneyDisplay("40.256", "EUR")).toBe("40.26 EUR");
  });

  it("formats zero", () => {
    expect(formatMoneyDisplay("0", "USD")).toBe("$0,00");
    expect(formatMoneyDisplay("0", "EUR")).toBe("0.00 EUR");
  });
});
