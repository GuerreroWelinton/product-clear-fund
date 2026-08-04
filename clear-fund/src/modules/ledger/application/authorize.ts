import { auth, ROLES } from "@/lib/auth";
import { prisma } from "@/lib/db";

import { F20_ERROR_CODES, LedgerError } from "../domain/errors";
import type { RequestContext } from "./context";

type Session = Awaited<ReturnType<typeof auth.api.getSession>>;

// Mirrors cash-funds/application/authorize.ts:26-51 (F02) with F20's own
// error codes — re-implemented rather than imported so a caller never sees a
// stray F02 code from an F20 read.
export async function requireSuperAdminOrAssignedTreasurer(
  ctx: RequestContext,
  cashFundId: string,
): Promise<NonNullable<Session>> {
  const session = await auth.api.getSession({ headers: ctx.headers });
  if (!session) {
    throw new LedgerError(
      F20_ERROR_CODES.UNAUTHORIZED,
      "Authentication required",
    );
  }
  if (session.user.role === ROLES.SUPER_ADMIN) {
    return session;
  }

  const assignment = await prisma.cashFundUser.findFirst({
    where: { cashFundId, userId: session.user.id, status: "ACTIVE" },
  });
  if (!assignment) {
    throw new LedgerError(
      F20_ERROR_CODES.UNAUTHORIZED,
      "Not assigned to this cash fund",
    );
  }
  return session;
}
