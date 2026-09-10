import type { RequestContext } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AUDIT_ACTIONS, AUDIT_ENTITY_TYPES } from "@/modules/audit/domain/event-types";
import { buildChangeSet } from "@/modules/audit/domain/rules";
// Concrete path, not the module barrel: the barrel pulls in the audit read side,
// which depends back on this module (import cycle).
import {
  auditActorFromSession,
  recordAuditEvent,
} from "@/modules/audit/application/record-audit-event";

import { toAssignmentDto, type TreasurerAssignmentDto } from "../domain/dto";
import { AssignmentError, F03_ERROR_CODES, mapUnexpectedError } from "../domain/errors";
import { resolveUnassignAction } from "../domain/rules";
import { unassignTreasurerSchema, type UnassignTreasurerInput } from "../schemas";
import { requireSuperAdmin } from "./authorize";

// FR-F03-003 / BR-F03-004: a Super Admin withdraws an assignment. This is a
// soft-delete — the row is flipped to REVOKED, never deleted — so historical
// operations keep referencing the treasurer (ADR-012). Idempotent: revoking a
// missing or already-revoked assignment is a no-op.
export async function unassignTreasurer(
  input: UnassignTreasurerInput,
  ctx: RequestContext,
): Promise<TreasurerAssignmentDto> {
  const parsed = unassignTreasurerSchema.safeParse(input);
  if (!parsed.success) {
    throw new AssignmentError(
      F03_ERROR_CODES.INVALID_INPUT,
      "Invalid unassignment input",
      { cause: parsed.error },
    );
  }

  const session = await requireSuperAdmin(ctx);

  const { cashFundId, userId } = parsed.data;

  try {
    const existing = await prisma.cashFundUser.findUnique({
      where: { cashFundId_userId: { cashFundId, userId } },
    });

    if (!existing) {
      throw new AssignmentError(
        F03_ERROR_CODES.ASSIGNMENT_NOT_FOUND,
        "Assignment not found",
      );
    }

    const action = resolveUnassignAction(existing);
    if (action === "NOOP") {
      // Already REVOKED: no state changed, so there is nothing to audit
      // (ADR-013).
      return toAssignmentDto(existing);
    }

    // F23: the audit event is written INSIDE the same transaction as the change
    // it describes, so a confirmed revocation can never lack its event (ADR-013).
    const revoked = await prisma.$transaction(async (tx) => {
      const row = await tx.cashFundUser.update({
        where: { cashFundId_userId: { cashFundId, userId } },
        data: { status: "REVOKED" },
      });
      await recordAuditEvent(tx, {
        actor: auditActorFromSession(session),
        action: AUDIT_ACTIONS.TREASURER_UNASSIGNED,
        entityType: AUDIT_ENTITY_TYPES.CASH_FUND_USER,
        entityId: row.id,
        cashFundId,
        changes: buildChangeSet(
          { status: existing.status },
          { status: row.status },
        ),
      });
      return row;
    });
    return toAssignmentDto(revoked);
  } catch (error) {
    throw mapUnexpectedError(error);
  }
}
