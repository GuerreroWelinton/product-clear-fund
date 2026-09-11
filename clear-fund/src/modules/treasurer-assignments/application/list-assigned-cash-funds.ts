import { ROLES, type RequestContext } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { resolveCashFundVisibility } from "@/lib/permissions";

import { mapUnexpectedError } from "../domain/errors";
import { requireSession } from "./authorize";

// FR-F03-002 / BR-F03-005: the set of cash-fund ids the caller may see. A
// Super Admin has global access (all funds); a treasurer sees only funds with
// an ACTIVE assignment. This is the single source of truth for fund
// visibility — the actual decision lives in lib/permissions; this only
// resolves it against the caller's session and turns it into concrete ids.
export async function listAssignedCashFunds(
  ctx: RequestContext,
): Promise<string[]> {
  const session = await requireSession(ctx);

  try {
    const isSuperAdmin = session.user.role === ROLES.SUPER_ADMIN;

    // The assignment lookup is skipped for a Super Admin: their visibility
    // never depends on it (resolveCashFundVisibility ignores the ids too).
    const assignedCashFundIds = isSuperAdmin
      ? []
      : (
          await prisma.cashFundUser.findMany({
            where: { userId: session.user.id, status: "ACTIVE" },
            select: { cashFundId: true },
          })
        ).map((assignment) => assignment.cashFundId);

    const visibility = resolveCashFundVisibility({
      isSuperAdmin,
      assignedCashFundIds,
    });

    if (visibility.kind === "ALL") {
      const funds = await prisma.cashFund.findMany({ select: { id: true } });
      return funds.map((fund) => fund.id);
    }
    return visibility.cashFundIds;
  } catch (error) {
    throw mapUnexpectedError(error);
  }
}
