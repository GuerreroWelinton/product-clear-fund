import { ROLES } from "@/lib/auth";
import { prisma } from "@/lib/db";

import { mapUnexpectedError } from "../domain/errors";
import { requireSession } from "./authorize";
import type { RequestContext } from "./context";

// FR-F03-002 / BR-F03-005: the set of cash-fund ids the caller may see. A
// Super Admin has global access (all funds); a treasurer sees only funds with
// an ACTIVE assignment. This is the single source of truth for fund visibility.
export async function listAssignedCashFunds(
  ctx: RequestContext,
): Promise<string[]> {
  const session = await requireSession(ctx);

  try {
    if (session.user.role === ROLES.SUPER_ADMIN) {
      const funds = await prisma.cashFund.findMany({ select: { id: true } });
      return funds.map((fund) => fund.id);
    }

    const assignments = await prisma.cashFundUser.findMany({
      where: { userId: session.user.id, status: "ACTIVE" },
      select: { cashFundId: true },
    });
    return assignments.map((assignment) => assignment.cashFundId);
  } catch (error) {
    throw mapUnexpectedError(error);
  }
}
