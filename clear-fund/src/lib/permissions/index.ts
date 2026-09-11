// Shared fund-visibility rule (finding 1 of the review). "Which cash funds
// may this caller see" was duplicated across list-assigned-cash-funds.ts and
// two pages, each re-deciding SUPER_ADMIN-vs-treasurer on its own. This is
// the single place that decision lives now.
//
// Deliberately PURE: no Prisma, no session lookup. Callers resolve the
// caller's role and their already-assigned fund ids first (session/DB
// concerns stay in the module layer) and hand them in as plain values, which
// is what makes this directly unit-testable. When F25 adds a read-only
// MEMBER role, this is the one function that needs to learn about it.
export type CashFundVisibility =
  | { kind: "ALL" }
  | { kind: "FUNDS"; cashFundIds: string[] };

export function resolveCashFundVisibility(params: {
  isSuperAdmin: boolean;
  assignedCashFundIds: string[];
}): CashFundVisibility {
  if (params.isSuperAdmin) {
    return { kind: "ALL" };
  }
  return { kind: "FUNDS", cashFundIds: [...params.assignedCashFundIds] };
}
