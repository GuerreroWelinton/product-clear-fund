import { prisma } from "@/lib/db";

import { toCashFundDto, type CashFundDto } from "../domain/dto";
import { CashFundError, F02_ERROR_CODES, mapUnexpectedError } from "../domain/errors";
import { canTransition } from "../domain/rules";
import {
  deactivateCashFundSchema,
  type DeactivateCashFundInput,
} from "../schemas";
import { requireSuperAdmin } from "./authorize";
import type { RequestContext } from "./context";

// FR-F02-003 / BR-F02-006: only ACTIVE -> INACTIVE is a valid deactivation.
export async function deactivateCashFund(
  input: DeactivateCashFundInput,
  ctx: RequestContext,
): Promise<CashFundDto> {
  const parsed = deactivateCashFundSchema.safeParse(input);
  if (!parsed.success) {
    throw new CashFundError(
      F02_ERROR_CODES.INVALID_INPUT,
      "Invalid deactivate input",
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

    if (!canTransition(fund.status, "INACTIVE")) {
      throw new CashFundError(
        F02_ERROR_CODES.INVALID_STATE_TRANSITION,
        `Cannot transition from ${fund.status} to INACTIVE`,
      );
    }

    const updated = await prisma.cashFund.update({
      where: { id: fund.id },
      data: { status: "INACTIVE", deactivatedAt: new Date() },
    });
    return toCashFundDto(updated);
  } catch (error) {
    throw mapUnexpectedError(error);
  }
}
