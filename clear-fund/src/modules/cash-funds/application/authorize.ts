import { auth, ROLES, type RequestContext } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { resolveCashFundVisibility, type CashFundVisibility } from "@/lib/permissions";
// Concrete path, not the module barrel: mirrors the cycle-avoidance already
// used by audit/application/authorize.ts for the same import.
import { listAssignedCashFunds } from "@/modules/treasurer-assignments/application/list-assigned-cash-funds";

import { CashFundError, F02_ERROR_CODES } from "../domain/errors";

type Session = Awaited<ReturnType<typeof auth.api.getSession>>;

// FR-F02-001: only a Super Admin manages the fund's lifecycle/structural
// config. Re-checked server-side on every call; never trust the client.
export async function requireSuperAdmin(
  ctx: RequestContext,
): Promise<NonNullable<Session>> {
  const session = await auth.api.getSession({ headers: ctx.headers });
  if (!session || session.user.role !== ROLES.SUPER_ADMIN) {
    throw new CashFundError(
      F02_ERROR_CODES.UNAUTHORIZED,
      "Super Admin role required",
    );
  }
  return session;
}

// FR-F02-002: operational config may be edited by a Super Admin OR a
// treasurer with an ACTIVE CashFundUser assignment to that specific fund.
export async function requireSuperAdminOrAssignedTreasurer(
  ctx: RequestContext,
  cashFundId: string,
): Promise<NonNullable<Session>> {
  const session = await auth.api.getSession({ headers: ctx.headers });
  if (!session) {
    throw new CashFundError(
      F02_ERROR_CODES.UNAUTHORIZED,
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
    throw new CashFundError(
      F02_ERROR_CODES.UNAUTHORIZED,
      "Not assigned to this cash fund",
    );
  }
  return session;
}

// FR-F02-004 / FR-F03-002: which cash funds an authenticated caller may list.
// Fund visibility is NOT reimplemented here — it is resolved once via
// lib/permissions and F03's listAssignedCashFunds (single source of truth),
// the same way audit/application/authorize.ts resolves its own read scope.
export async function resolveVisibilityForCaller(
  ctx: RequestContext,
): Promise<{ session: NonNullable<Session>; visibility: CashFundVisibility }> {
  const session = await auth.api.getSession({ headers: ctx.headers });
  if (!session) {
    throw new CashFundError(
      F02_ERROR_CODES.UNAUTHORIZED,
      "Authentication required",
    );
  }

  const isSuperAdmin = session.user.role === ROLES.SUPER_ADMIN;
  const assignedCashFundIds = isSuperAdmin
    ? []
    : await listAssignedCashFunds(ctx);

  const visibility = resolveCashFundVisibility({
    isSuperAdmin,
    assignedCashFundIds,
  });

  return { session, visibility };
}
