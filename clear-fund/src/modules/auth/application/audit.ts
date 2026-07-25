// F23 wiring for F01 (ADR-013). The audit debt that ADR-008 deferred to F23 is
// paid here.
//
// Unlike F02/F03, these events are NOT atomic with the change they describe:
// F01's writes go through Better Auth (`auth.api.createUser` / `banUser` /
// `unbanUser` / `revokeUserSessions`), which owns its own database access through
// the Prisma adapter and accepts no external transaction. The event is therefore
// appended immediately AFTER the Better Auth call succeeds, and a failure to
// append it propagates: a noisy failure the operator can reconcile beats a silent
// hole in the audit trail (ADR-013, section 6).
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
// Concrete path, not the module barrel: the barrel pulls in the audit read side,
// which depends on the treasurer-assignments module (import cycle).
import {
  recordAuditEvent,
  type AuditActor,
} from "@/modules/audit/application/record-audit-event";
import {
  AUDIT_ACTIONS,
  AUDIT_ENTITY_TYPES,
} from "@/modules/audit/domain/event-types";
import type { AuditChangeSet } from "@/modules/audit/domain/rules";

import type { RequestContext } from "./context";

// Only the actions F01 can emit.
export type UserAuditAction =
  | typeof AUDIT_ACTIONS.USER_CREATED
  | typeof AUDIT_ACTIONS.USER_DISABLED
  | typeof AUDIT_ACTIONS.USER_ENABLED
  | typeof AUDIT_ACTIONS.USER_SESSIONS_REVOKED;

// The acting admin, read from the request headers. Better Auth already rejects a
// non-admin caller; this only resolves WHO acted, for the audit snapshot.
// Resolved BEFORE the operation runs, since disabling a user revokes sessions.
export async function resolveAuditActor(
  ctx: RequestContext,
): Promise<AuditActor | null> {
  const session = await auth.api.getSession({ headers: ctx.headers });
  if (!session) {
    return null;
  }
  return {
    id: session.user.id,
    email: session.user.email ?? null,
    role: session.user.role ?? null,
  };
}

// The previous state of an audited user, so the event can carry real before/after
// values (BR-F23-002). Returns null when the user does not exist yet (create).
export async function loadUserAuditState(userId: string): Promise<{
  banned: boolean;
  banReason: string | null;
  role: string | null;
  activeSessions: number;
} | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { banned: true, banReason: true, role: true },
  });
  if (!user) {
    return null;
  }
  const activeSessions = await prisma.session.count({ where: { userId } });
  return {
    banned: user.banned ?? false,
    banReason: user.banReason,
    role: user.role,
    activeSessions,
  };
}

// Appends one user audit event. cashFundId is always null: accounts are global,
// they belong to no fund (spec edge case "evento sin caja", ADR-013).
export async function recordUserEvent(params: {
  actor: AuditActor | null;
  action: UserAuditAction;
  userId: string;
  reason?: string | null;
  changes: AuditChangeSet;
}): Promise<void> {
  await recordAuditEvent(prisma, {
    actor: params.actor,
    action: params.action,
    entityType: AUDIT_ENTITY_TYPES.USER,
    entityId: params.userId,
    cashFundId: null,
    reason: params.reason ?? null,
    changes: params.changes,
  });
}

export { AUDIT_ACTIONS };
