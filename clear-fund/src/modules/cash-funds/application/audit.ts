// F23 wiring for F02 (ADR-013). The audit debt that ADR-010 deferred to F23 is
// paid here: every sensitive cash-fund write records an immutable event inside
// the same transaction that applies the change.
//
// Imported by concrete path, not through the audit module barrel: the barrel
// pulls in the audit read side, which depends back on this module's authorization
// seam (import cycle).
import {
  auditActorFromSession,
  recordAuditEvent,
  type AuditWriteClient,
} from "@/modules/audit/application/record-audit-event";
import {
  AUDIT_ACTIONS,
  AUDIT_ENTITY_TYPES,
} from "@/modules/audit/domain/event-types";
import type { AuditChangeSet } from "@/modules/audit/domain/rules";

// Only the actions F02 can emit; keeps a typo from silently inventing an action.
export type CashFundAuditAction =
  | typeof AUDIT_ACTIONS.CASH_FUND_CREATED
  | typeof AUDIT_ACTIONS.CASH_FUND_DRAFT_UPDATED
  | typeof AUDIT_ACTIONS.CASH_FUND_ACTIVATED
  | typeof AUDIT_ACTIONS.CASH_FUND_DEACTIVATED
  | typeof AUDIT_ACTIONS.CASH_FUND_CONFIG_CHANGED;

// Structural shape of a cash_fund row, so this file does not import Prisma types.
interface CashFundSnapshotSource {
  name: string;
  logoKey: string | null;
  phrase: string | null;
  currency: string;
  monthlySavingAmount: { toString(): string };
  officialStartDate: Date | null;
  status: string;
  nextMemberNumber: number;
  recommendedDay: number;
  maximumDay: number;
  maxAdvanceMonths: number;
  riskThreshold: number;
  activatedAt: Date | null;
  deactivatedAt: Date | null;
}

// The audited fields of a fund. Update use cases diff the full snapshot before
// and after: buildChangeSet keeps only what actually changed, so one snapshot
// serves every F02 write without each use case listing its own fields.
export function cashFundAuditSnapshot(
  fund: CashFundSnapshotSource,
): Record<string, unknown> {
  return {
    name: fund.name,
    logoKey: fund.logoKey,
    phrase: fund.phrase,
    currency: fund.currency,
    // Decimal: toAuditValue turns it into a decimal string, never a number.
    monthlySavingAmount: fund.monthlySavingAmount,
    officialStartDate: fund.officialStartDate,
    status: fund.status,
    nextMemberNumber: fund.nextMemberNumber,
    recommendedDay: fund.recommendedDay,
    maximumDay: fund.maximumDay,
    maxAdvanceMonths: fund.maxAdvanceMonths,
    riskThreshold: fund.riskThreshold,
    activatedAt: fund.activatedAt,
    deactivatedAt: fund.deactivatedAt,
  };
}

// Appends one cash-fund audit event. `client` must be the transaction client of
// the write being audited, so the event and the change commit together.
export async function recordCashFundEvent(
  client: AuditWriteClient,
  params: {
    session: { user: { id: string; email?: string | null; role?: string | null } };
    action: CashFundAuditAction;
    cashFundId: string;
    changes: AuditChangeSet;
  },
): Promise<void> {
  await recordAuditEvent(client, {
    actor: auditActorFromSession(params.session),
    action: params.action,
    entityType: AUDIT_ENTITY_TYPES.CASH_FUND,
    entityId: params.cashFundId,
    cashFundId: params.cashFundId,
    changes: params.changes,
  });
}

export { AUDIT_ACTIONS };
