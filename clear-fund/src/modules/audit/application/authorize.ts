import { auth, ROLES, type RequestContext } from "@/lib/auth";
// Imported by concrete path, not through the module barrel: the audited features
// import the audit writer, so going through barrels here would close an import
// cycle (treasurer-assignments -> audit -> treasurer-assignments).
import { listAssignedCashFunds } from "@/modules/treasurer-assignments/application/list-assigned-cash-funds";

import { AuditError, F23_ERROR_CODES } from "../domain/errors";
import { resolveAuditScope, type AuditScope } from "../domain/rules";

type Session = Awaited<ReturnType<typeof auth.api.getSession>>;

// Reading the audit log requires an authenticated caller. FR-F23-003 mentions an
// "auditor"; per ADR-013 that is a read capability, not a new role — no AUDITOR
// role is introduced.
export async function requireSession(
  ctx: RequestContext,
): Promise<NonNullable<Session>> {
  const session = await auth.api.getSession({ headers: ctx.headers });
  if (!session) {
    throw new AuditError(
      F23_ERROR_CODES.UNAUTHORIZED,
      "Authentication required",
    );
  }
  return session;
}

// FR-F23-001 / FR-F23-002: resolves what the caller may read. Fund visibility is
// NOT reimplemented here — it comes from F03's listAssignedCashFunds, the single
// source of truth (ADR-013). Throws F23_FORBIDDEN_CASH_FUND when a treasurer
// asks for a fund they are not assigned to.
export async function resolveScopeForCaller(
  ctx: RequestContext,
  requestedCashFundId: string | null,
): Promise<{ session: NonNullable<Session>; scope: AuditScope }> {
  const session = await requireSession(ctx);
  const isSuperAdmin = session.user.role === ROLES.SUPER_ADMIN;

  // A Super Admin has global access, so the assignment lookup is skipped.
  const assignedCashFundIds = isSuperAdmin ? [] : await listAssignedCashFunds(ctx);

  const scope = resolveAuditScope({
    isSuperAdmin,
    requestedCashFundId,
    assignedCashFundIds,
  });

  if (scope.kind === "FORBIDDEN") {
    throw new AuditError(
      F23_ERROR_CODES.FORBIDDEN_CASH_FUND,
      "Not assigned to this cash fund",
    );
  }

  return { session, scope };
}
