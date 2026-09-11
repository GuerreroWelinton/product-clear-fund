import type { RequestContext } from "@/lib/auth";
import { prisma } from "@/lib/db";

import type { CashFundHeaderDto } from "../domain/dto";
import { F20_ERROR_CODES, LedgerError, mapUnexpectedError } from "../domain/errors";
import { getCashFundHeaderSchema, type GetCashFundHeaderInput } from "../schemas";
import { requireSuperAdminOrAssignedTreasurer } from "./authorize";

// Code review finding 1, pass 2: the ledger page named its fund by calling
// `prisma.cashFund.findUnique` straight from the page (ARCHITECTURE.md: Prisma
// must not leak into pages). This is that read use case.
//
// It lives in ledger/application, not cash-funds/application, mirroring
// getCashFundBalance's own choice: ADR-014 has F20 re-implement
// requireSuperAdminOrAssignedTreasurer rather than import cash-funds' so an
// F20 read never surfaces a stray F02 code. Importing a cash-funds read use
// case here to fetch the SAME fund this page already authorized against would
// reopen exactly that seam. Authorization stays identical to what the page
// already relied on for the balance cards: same guard, same fund id, so the
// fund's name is never disclosed to a caller who isn't authorized for it.
export async function getCashFundHeader(
  input: GetCashFundHeaderInput,
  ctx: RequestContext,
): Promise<CashFundHeaderDto> {
  const parsed = getCashFundHeaderSchema.safeParse(input);
  if (!parsed.success) {
    throw new LedgerError(
      F20_ERROR_CODES.INVALID_INPUT,
      "Invalid cash fund header query",
      { cause: parsed.error },
    );
  }

  const { cashFundId } = parsed.data;
  await requireSuperAdminOrAssignedTreasurer(ctx, cashFundId);

  try {
    const fund = await prisma.cashFund.findUnique({
      where: { id: cashFundId },
      select: { name: true },
    });
    if (!fund) {
      throw new LedgerError(
        F20_ERROR_CODES.CASH_FUND_NOT_FOUND,
        "Cash fund not found",
      );
    }
    return { cashFundId, name: fund.name };
  } catch (error) {
    throw mapUnexpectedError(error);
  }
}
