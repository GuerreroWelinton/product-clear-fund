import { describe, expect, it } from "vitest";

import { resolveCashFundVisibility } from "./index";

// FR-F03-002 / BR-F03-005: "which cash funds may this caller see" is a single
// pure decision (finding 1). It takes only the caller's role flag and their
// already-resolved assigned fund ids — no Prisma, no session — so it is
// directly unit-testable and reusable from every place that needs it.
describe("resolveCashFundVisibility", () => {
  it("gives a SUPER_ADMIN global visibility, regardless of assignments", () => {
    expect(
      resolveCashFundVisibility({
        isSuperAdmin: true,
        assignedCashFundIds: [],
      }),
    ).toEqual({ kind: "ALL" });
  });

  it("scopes a treasurer to only their actively assigned funds", () => {
    expect(
      resolveCashFundVisibility({
        isSuperAdmin: false,
        assignedCashFundIds: ["fund-1", "fund-2"],
      }),
    ).toEqual({ kind: "FUNDS", cashFundIds: ["fund-1", "fund-2"] });
  });

  it("scopes a treasurer with no active assignment to an empty set", () => {
    expect(
      resolveCashFundVisibility({
        isSuperAdmin: false,
        assignedCashFundIds: [],
      }),
    ).toEqual({ kind: "FUNDS", cashFundIds: [] });
  });

  it("does not mutate the assigned-ids array it was given", () => {
    const assignedCashFundIds = ["fund-1"];

    const result = resolveCashFundVisibility({
      isSuperAdmin: false,
      assignedCashFundIds,
    });

    expect(result).toEqual({ kind: "FUNDS", cashFundIds: ["fund-1"] });
    assignedCashFundIds.push("fund-2");
    expect(result).toEqual({ kind: "FUNDS", cashFundIds: ["fund-1"] });
  });
});
