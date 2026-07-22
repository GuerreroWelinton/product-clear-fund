import Decimal from "decimal.js";
import { describe, expect, it } from "vitest";

// Smoke test for the toolchain. Also guards the project's first rule:
// never use floating-point numbers for money.
describe("toolchain", () => {
  it("runs vitest", () => {
    expect(true).toBe(true);
  });

  it("adds money with decimal.js without float error", () => {
    // With plain JS numbers this is 0.30000000000000004.
    expect(0.1 + 0.2).not.toBe(0.3);
    // With decimal.js it is exact.
    expect(new Decimal("0.1").plus("0.2").toString()).toBe("0.3");
  });
});
