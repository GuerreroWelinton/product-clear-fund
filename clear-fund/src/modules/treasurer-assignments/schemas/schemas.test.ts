import { describe, expect, it } from "vitest";

import { assignTreasurerSchema, unassignTreasurerSchema } from ".";

describe("assignTreasurerSchema", () => {
  it("accepts a valid (cashFundId, userId) pair", () => {
    expect(
      assignTreasurerSchema.safeParse({ cashFundId: "f1", userId: "u1" })
        .success,
    ).toBe(true);
  });

  it("rejects an empty cashFundId", () => {
    expect(
      assignTreasurerSchema.safeParse({ cashFundId: "", userId: "u1" }).success,
    ).toBe(false);
  });

  it("rejects a missing userId", () => {
    expect(
      unassignTreasurerSchema.safeParse({ cashFundId: "f1" }).success,
    ).toBe(false);
  });
});
