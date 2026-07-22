import { prisma } from "@/lib/db";

import { toCashFundDto, type CashFundDto } from "../domain/dto";
import { CashFundError, F02_ERROR_CODES, mapUnexpectedError } from "../domain/errors";
import {
  canEditFixedFee,
  validateDayConfig,
  validatePositiveAmount,
} from "../domain/rules";
import {
  updateCashFundDraftSchema,
  type UpdateCashFundDraftInput,
} from "../schemas";
import { requireSuperAdmin } from "./authorize";
import type { RequestContext } from "./context";

// FR-F02-001 / BR-F02-002/003/004: while a fund is DRAFT, a Super Admin can
// still adjust its structural config (name/phrase/logoKey/monthlySavingAmount/
// officialStartDate/day-config). Once it is no longer DRAFT the fixed fee is
// locked (BR-F02-002/004) and this whole operation is invalid.
export async function updateCashFundDraft(
  input: UpdateCashFundDraftInput,
  ctx: RequestContext,
): Promise<CashFundDto> {
  const parsed = updateCashFundDraftSchema.safeParse(input);
  if (!parsed.success) {
    throw new CashFundError(
      F02_ERROR_CODES.INVALID_INPUT,
      "Invalid draft update input",
      { cause: parsed.error },
    );
  }

  await requireSuperAdmin(ctx);

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

    const changingFixedFee = parsed.data.monthlySavingAmount !== undefined;
    if (changingFixedFee && !canEditFixedFee(fund)) {
      throw new CashFundError(
        F02_ERROR_CODES.CASH_FUND_FIXED_FEE_LOCKED,
        "The fixed fee can only be changed while the fund is DRAFT",
      );
    }
    if (fund.status !== "DRAFT") {
      throw new CashFundError(
        F02_ERROR_CODES.INVALID_STATE_TRANSITION,
        "Cash fund is not in DRAFT state",
      );
    }

    if (parsed.data.monthlySavingAmount !== undefined) {
      validatePositiveAmount(parsed.data.monthlySavingAmount);
    }

    const recommendedDay = parsed.data.recommendedDay ?? fund.recommendedDay;
    const maximumDay = parsed.data.maximumDay ?? fund.maximumDay;
    if (
      parsed.data.recommendedDay !== undefined ||
      parsed.data.maximumDay !== undefined
    ) {
      validateDayConfig(recommendedDay, maximumDay);
    }

    const updated = await prisma.cashFund.update({
      where: { id: fund.id },
      data: {
        ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
        ...(parsed.data.logoKey !== undefined
          ? { logoKey: parsed.data.logoKey }
          : {}),
        ...(parsed.data.phrase !== undefined
          ? { phrase: parsed.data.phrase }
          : {}),
        ...(parsed.data.monthlySavingAmount !== undefined
          ? { monthlySavingAmount: parsed.data.monthlySavingAmount }
          : {}),
        ...(parsed.data.officialStartDate !== undefined
          ? { officialStartDate: parsed.data.officialStartDate }
          : {}),
        recommendedDay,
        maximumDay,
        maxAdvanceMonths:
          parsed.data.maxAdvanceMonths ?? fund.maxAdvanceMonths,
        riskThreshold: parsed.data.riskThreshold ?? fund.riskThreshold,
      },
    });
    return toCashFundDto(updated);
  } catch (error) {
    throw mapUnexpectedError(error);
  }
}
