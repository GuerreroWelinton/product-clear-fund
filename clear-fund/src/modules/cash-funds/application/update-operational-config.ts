import { prisma } from "@/lib/db";

import { toCashFundDto, type CashFundDto } from "../domain/dto";
import { CashFundError, F02_ERROR_CODES, mapUnexpectedError } from "../domain/errors";
import { canEditOperationalConfig, validateDayConfig } from "../domain/rules";
import {
  updateOperationalConfigSchema,
  type UpdateOperationalConfigInput,
} from "../schemas";
import { requireSuperAdminOrAssignedTreasurer } from "./authorize";
import type { RequestContext } from "./context";

// FR-F02-002 / BR-F02-005: a Super Admin or a treasurer with an ACTIVE
// assignment to this fund can edit its operational config (recommendedDay/
// maximumDay/maxAdvanceMonths/riskThreshold) — never the fixed fee — and
// only while the fund is ACTIVE.
export async function updateOperationalConfig(
  input: UpdateOperationalConfigInput,
  ctx: RequestContext,
): Promise<CashFundDto> {
  const parsed = updateOperationalConfigSchema.safeParse(input);
  if (!parsed.success) {
    throw new CashFundError(
      F02_ERROR_CODES.INVALID_INPUT,
      "Invalid operational config input",
      { cause: parsed.error },
    );
  }

  await requireSuperAdminOrAssignedTreasurer(ctx, parsed.data.cashFundId);

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

    if (!canEditOperationalConfig(fund)) {
      throw new CashFundError(
        F02_ERROR_CODES.CASH_FUND_INACTIVE,
        "Cash fund must be ACTIVE to edit its operational config",
      );
    }

    const recommendedDay = parsed.data.recommendedDay ?? fund.recommendedDay;
    const maximumDay = parsed.data.maximumDay ?? fund.maximumDay;
    validateDayConfig(recommendedDay, maximumDay);

    const updated = await prisma.cashFund.update({
      where: { id: fund.id },
      data: {
        recommendedDay,
        maximumDay,
        maxAdvanceMonths: parsed.data.maxAdvanceMonths ?? fund.maxAdvanceMonths,
        riskThreshold: parsed.data.riskThreshold ?? fund.riskThreshold,
      },
    });
    return toCashFundDto(updated);
  } catch (error) {
    throw mapUnexpectedError(error);
  }
}
