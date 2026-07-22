import { prisma } from "@/lib/db";

import { toCashFundDto, type CashFundDto } from "../domain/dto";
import { CashFundError, F02_ERROR_CODES, mapUnexpectedError } from "../domain/errors";
import { validateDayConfig, validatePositiveAmount } from "../domain/rules";
import { createCashFundSchema, type CreateCashFundInput } from "../schemas";
import { requireSuperAdmin } from "./authorize";
import type { RequestContext } from "./context";

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

  await requireSuperAdmin(ctx);

  try {
    validateDayConfig(parsed.data.recommendedDay, parsed.data.maximumDay);
    validatePositiveAmount(parsed.data.monthlySavingAmount);

    const fund = await prisma.cashFund.create({
      data: {
        name: parsed.data.name,
        logoKey: parsed.data.logoKey ?? null,
        phrase: parsed.data.phrase ?? null,
        monthlySavingAmount: parsed.data.monthlySavingAmount,
        officialStartDate: parsed.data.officialStartDate ?? null,
        recommendedDay: parsed.data.recommendedDay,
        maximumDay: parsed.data.maximumDay,
        maxAdvanceMonths: parsed.data.maxAdvanceMonths,
        riskThreshold: parsed.data.riskThreshold,
      },
    });
    return toCashFundDto(fund);
  } catch (error) {
    throw mapUnexpectedError(error);
  }
}
