import type { RequestContext } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { buildCreationChangeSet } from "@/modules/audit/domain/rules";

import { toCashFundDto, type CashFundDto } from "../domain/dto";
import { CashFundError, F02_ERROR_CODES, mapUnexpectedError } from "../domain/errors";
import { toDbDate, validateDayConfig, validatePositiveAmount } from "../domain/rules";
import { createCashFundSchema, type CreateCashFundInput } from "../schemas";
import {
  AUDIT_ACTIONS,
  cashFundAuditSnapshot,
  recordCashFundEvent,
} from "./audit";
import { requireSuperAdmin } from "./authorize";

// FR-F02-001 / BR-F02-001/002: only a Super Admin creates a cash fund; it
// always starts in DRAFT so its structural config can still be adjusted
// before it goes live.
export async function createCashFund(
  input: CreateCashFundInput,
  ctx: RequestContext,
): Promise<CashFundDto> {
  const parsed = createCashFundSchema.safeParse(input);
  if (!parsed.success) {
    throw new CashFundError(
      F02_ERROR_CODES.INVALID_INPUT,
      "Invalid cash fund input",
      { cause: parsed.error },
    );
  }

  const session = await requireSuperAdmin(ctx);

  try {
    validateDayConfig(parsed.data.recommendedDay, parsed.data.maximumDay);
    validatePositiveAmount(parsed.data.monthlySavingAmount);

    // F23: the audit event commits with the fund itself (ADR-013).
    const fund = await prisma.$transaction(async (tx) => {
      const created = await tx.cashFund.create({
        data: {
          name: parsed.data.name,
          logoKey: parsed.data.logoKey ?? null,
          phrase: parsed.data.phrase ?? null,
          monthlySavingAmount: parsed.data.monthlySavingAmount,
          officialStartDate: toDbDate(parsed.data.officialStartDate),
          recommendedDay: parsed.data.recommendedDay,
          maximumDay: parsed.data.maximumDay,
          maxAdvanceMonths: parsed.data.maxAdvanceMonths,
          riskThreshold: parsed.data.riskThreshold,
        },
      });
      await recordCashFundEvent(tx, {
        session,
        action: AUDIT_ACTIONS.CASH_FUND_CREATED,
        cashFundId: created.id,
        changes: buildCreationChangeSet(cashFundAuditSnapshot(created)),
      });
      return created;
    });
    return toCashFundDto(fund);
  } catch (error) {
    throw mapUnexpectedError(error);
  }
}
