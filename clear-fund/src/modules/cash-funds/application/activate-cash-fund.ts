import type { RequestContext } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { buildChangeSet } from "@/modules/audit/domain/rules";

import { toCashFundDto, type CashFundDto } from "../domain/dto";
import { CashFundError, F02_ERROR_CODES, mapUnexpectedError } from "../domain/errors";
import {
  canTransition,
  validateDayConfig,
  validatePositiveAmount,
} from "../domain/rules";
import { activateCashFundSchema, type ActivateCashFundInput } from "../schemas";
import {
  AUDIT_ACTIONS,
  cashFundAuditSnapshot,
  recordCashFundEvent,
} from "./audit";
import { requireSuperAdmin } from "./authorize";

// FR-F02-003 / BR-F02-006: activates a cash fund. Handles both DRAFT->ACTIVE
// (initial activation) and INACTIVE->ACTIVE (reactivation, BR-F02-007).
export async function activateCashFund(
  input: ActivateCashFundInput,
  ctx: RequestContext,
): Promise<CashFundDto> {
  const parsed = activateCashFundSchema.safeParse(input);
  if (!parsed.success) {
    throw new CashFundError(
      F02_ERROR_CODES.INVALID_INPUT,
      "Invalid activate input",
      { cause: parsed.error },
    );
  }

  const session = await requireSuperAdmin(ctx);

  try {
    const fund = await prisma.cashFund.findUnique({
      where: { id: parsed.data.cashFundId },
    });
    if (!fund) {
      throw new CashFundError(
        F02_ERROR_CODES.CASH_FUND_NOT_FOUND,
        "Cash fund not found",
      );
    }

    if (!canTransition(fund.status, "ACTIVE")) {
      throw new CashFundError(
        F02_ERROR_CODES.INVALID_STATE_TRANSITION,
        `Cannot transition from ${fund.status} to ACTIVE`,
      );
    }

    if (fund.status === "DRAFT") {
      // Initial activation: validate the structural config is complete and
      // sane before the fund goes live (BR-F02-002/003/006).
      validateDayConfig(fund.recommendedDay, fund.maximumDay);
      validatePositiveAmount(fund.monthlySavingAmount.toString());

      // F23: the audit event commits with the transition (ADR-013).
      const activated = await prisma.$transaction(async (tx) => {
        const row = await tx.cashFund.update({
          where: { id: fund.id },
          data: { status: "ACTIVE", activatedAt: new Date() },
        });
        await recordCashFundEvent(tx, {
          session,
          action: AUDIT_ACTIONS.CASH_FUND_ACTIVATED,
          cashFundId: row.id,
          changes: buildChangeSet(
            cashFundAuditSnapshot(fund),
            cashFundAuditSnapshot(row),
          ),
        });
        return row;
      });
      return toCashFundDto(activated);
    }

    // fund.status === "INACTIVE": reactivation (BR-F02-007).
    // F06: generate missing savings obligations for months since
    // deactivatedAt (AC-F02-003 deferred, see ADR-010). `deactivatedAt` is
    // intentionally left untouched here — it is the anchor F06 will read to
    // compute the missed months; do not clear it before that seam runs.
    const reactivated = await prisma.$transaction(async (tx) => {
      const row = await tx.cashFund.update({
        where: { id: fund.id },
        data: { status: "ACTIVE", activatedAt: new Date() },
      });
      await recordCashFundEvent(tx, {
        session,
        action: AUDIT_ACTIONS.CASH_FUND_ACTIVATED,
        cashFundId: row.id,
        changes: buildChangeSet(
          cashFundAuditSnapshot(fund),
          cashFundAuditSnapshot(row),
        ),
      });
      return row;
    });
    return toCashFundDto(reactivated);
  } catch (error) {
    throw mapUnexpectedError(error);
  }
}
