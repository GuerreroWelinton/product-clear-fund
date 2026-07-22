import { describe, expect, it } from "vitest";

import {
  activateCashFundSchema,
  createCashFundSchema,
  deactivateCashFundSchema,
  updateCashFundDraftSchema,
  updateOperationalConfigSchema,
} from "./index";

describe("createCashFundSchema", () => {
  const valid = {
    name: "Caja Los Andes",
    monthlySavingAmount: "150.00",
    recommendedDay: 5,
    maximumDay: 10,
    maxAdvanceMonths: 3,
    riskThreshold: 2,
  };

  it("accepts a valid minimal input", () => {
    expect(createCashFundSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts optional logoKey, phrase and officialStartDate", () => {
    const result = createCashFundSchema.safeParse({
      ...valid,
      logoKey: "logos/andes.png",
      phrase: "Ahorro con propósito",
      officialStartDate: "2026-08-01",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an empty name", () => {
    expect(
      createCashFundSchema.safeParse({ ...valid, name: "" }).success,
    ).toBe(false);
  });

  it("rejects a monthlySavingAmount with more than 2 decimals", () => {
    expect(
      createCashFundSchema.safeParse({
        ...valid,
        monthlySavingAmount: "150.123",
      }).success,
    ).toBe(false);
  });

  it("rejects a non-numeric monthlySavingAmount", () => {
    expect(
      createCashFundSchema.safeParse({ ...valid, monthlySavingAmount: "abc" })
        .success,
    ).toBe(false);
  });

  it("rejects a negative monthlySavingAmount", () => {
    expect(
      createCashFundSchema.safeParse({
        ...valid,
        monthlySavingAmount: "-10.00",
      }).success,
    ).toBe(false);
  });

  it("rejects non-integer day values", () => {
    expect(
      createCashFundSchema.safeParse({ ...valid, recommendedDay: 5.5 })
        .success,
    ).toBe(false);
  });
});

describe("updateCashFundDraftSchema", () => {
  it("accepts a partial update with only cashFundId", () => {
    expect(
      updateCashFundDraftSchema.safeParse({ cashFundId: "fund-1" }).success,
    ).toBe(true);
  });

  it("accepts nulling out logoKey and phrase", () => {
    const result = updateCashFundDraftSchema.safeParse({
      cashFundId: "fund-1",
      logoKey: null,
      phrase: null,
    });
    expect(result.success).toBe(true);
  });

  it("rejects a missing cashFundId", () => {
    expect(updateCashFundDraftSchema.safeParse({ name: "x" }).success).toBe(
      false,
    );
  });

  it("rejects an invalid monthlySavingAmount", () => {
    expect(
      updateCashFundDraftSchema.safeParse({
        cashFundId: "fund-1",
        monthlySavingAmount: "10.999",
      }).success,
    ).toBe(false);
  });
});

describe("activateCashFundSchema / deactivateCashFundSchema", () => {
  it("accept a non-empty cashFundId", () => {
    expect(
      activateCashFundSchema.safeParse({ cashFundId: "fund-1" }).success,
    ).toBe(true);
    expect(
      deactivateCashFundSchema.safeParse({ cashFundId: "fund-1" }).success,
    ).toBe(true);
  });

  it("reject a missing cashFundId", () => {
    expect(activateCashFundSchema.safeParse({}).success).toBe(false);
    expect(deactivateCashFundSchema.safeParse({}).success).toBe(false);
  });
});

describe("updateOperationalConfigSchema", () => {
  it("accepts a partial operational config update", () => {
    const result = updateOperationalConfigSchema.safeParse({
      cashFundId: "fund-1",
      recommendedDay: 5,
      maximumDay: 15,
    });
    expect(result.success).toBe(true);
  });

  it("rejects a missing cashFundId", () => {
    expect(
      updateOperationalConfigSchema.safeParse({ recommendedDay: 5 }).success,
    ).toBe(false);
  });

  it("rejects a monthlySavingAmount field (not part of operational config)", () => {
    const result = updateOperationalConfigSchema.safeParse({
      cashFundId: "fund-1",
      monthlySavingAmount: "10.00",
    });
    // Extra unknown fields are simply not present on the parsed output.
    expect(result.success && "monthlySavingAmount" in result.data).toBe(
      false,
    );
  });
});
