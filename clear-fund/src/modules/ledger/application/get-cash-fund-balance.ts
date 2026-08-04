import { prisma } from "@/lib/db";

import {
  deriveAccountingBalance,
  deriveCommittedBalance,
  deriveFreeBalance,
} from "../domain/balance";
import type { CashFundBalanceDto } from "../domain/dto";
import { F20_ERROR_CODES, LedgerError, mapUnexpectedError } from "../domain/errors";
import { getCashFundBalanceSchema, type GetCashFundBalanceInput } from "../schemas";
import { requireSuperAdminOrAssignedTreasurer } from "./authorize";
import type { RequestContext } from "./context";

// Prisma's aggregate returns `_sum.amount === null` when no row matches
// (empty ledger, day one per ADR-014). decimal.js throws on null, so this
// MUST be coalesced before it reaches the domain.
function sumToString(sum: { toString(): string } | null): string {
  return sum === null ? "0" : sum.toString();
}

// FR-F20-001: the three balance cards (plan.md). Read-only, so no
// $transaction and no audit event — consulting a balance changes nothing.
export async function getCashFundBalance(
  input: GetCashFundBalanceInput,
  ctx: RequestContext,
): Promise<CashFundBalanceDto> {
  const parsed = getCashFundBalanceSchema.safeParse(input);
  if (!parsed.success) {
    throw new LedgerError(
      F20_ERROR_CODES.INVALID_INPUT,
      "Invalid cash fund balance query",
      { cause: parsed.error },
    );
  }

  const { cashFundId } = parsed.data;
  await requireSuperAdminOrAssignedTreasurer(ctx, cashFundId);

  try {
    const fund = await prisma.cashFund.findUnique({
      where: { id: cashFundId },
      select: { id: true, currency: true },
    });
    if (!fund) {
      throw new LedgerError(
        F20_ERROR_CODES.CASH_FUND_NOT_FOUND,
        "Cash fund not found",
      );
    }

    // Two aggregates, summed in Postgres — the ledger is never loaded into
    // memory just to compute a total.
    const [inSum, outSum] = await Promise.all([
      prisma.cashMovement.aggregate({
        where: { cashFundId, direction: "IN" },
        _sum: { amount: true },
      }),
      prisma.cashMovement.aggregate({
        where: { cashFundId, direction: "OUT" },
        _sum: { amount: true },
      }),
    ]);

    const accountingBalance = deriveAccountingBalance({
      totalIn: sumToString(inSum._sum.amount),
      totalOut: sumToString(outSum._sum.amount),
    });

    // F13 SEAM (ADR-014): no loan-in-progress state exists yet, so the array
    // is always empty today — never hardcode "0.00" in its place.
    const committedBalance = deriveCommittedBalance([]);

    const freeBalance = deriveFreeBalance({ accountingBalance, committedBalance });

    return {
      cashFundId,
      currency: fund.currency,
      accountingBalance,
      committedBalance,
      freeBalance,
    };
  } catch (error) {
    throw mapUnexpectedError(error);
  }
}
