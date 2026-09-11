// Pure balance derivation (F20 / FINANCIAL_FORMULAS.md). Money crosses every
// boundary as a decimal string; arithmetic uses decimal.js, never number.
import { Decimal } from "decimal.js";

import { toMoneyString } from "@/lib/money";

import { F20_ERROR_CODES, LedgerError } from "./errors";

// saldo_contable = suma(entradas confirmadas) - suma(salidas confirmadas)
export function deriveAccountingBalance(params: {
  totalIn: string;
  totalOut: string;
}): string {
  return toMoneyString(new Decimal(params.totalIn).minus(params.totalOut));
}

// saldo_comprometido = suma(préstamos en desembolso en proceso).
//
// F13 SEAM (ADR-014): no caller can supply a non-empty array today, since no
// loan-in-progress state exists yet. Implemented and tested for real anyway.
export function deriveCommittedBalance(
  loansInProgress: { principalAmount: string }[],
): string {
  const total = loansInProgress.reduce(
    (sum, loan) => sum.plus(loan.principalAmount),
    new Decimal(0),
  );
  return toMoneyString(total);
}

// saldo_libre = saldo_contable - saldo_comprometido
export function deriveFreeBalance(params: {
  accountingBalance: string;
  committedBalance: string;
}): string {
  return toMoneyString(
    new Decimal(params.accountingBalance).minus(params.committedBalance),
  );
}

// BR-F20-008 / DATABASE_CONSTRAINTS.md "saldo libre suficiente ... antes de
// desembolsar". F14 SEAM: the disbursement feature calls this before it lets
// a loan draw down the free balance. Exactly-equal is allowed (free reaches
// 0.00); one cent over is not.
export function assertSufficientBalance(params: {
  freeBalance: string;
  amount: string;
}): void {
  const freeBalance = new Decimal(params.freeBalance);
  const amount = new Decimal(params.amount);

  if (amount.gt(freeBalance)) {
    throw new LedgerError(
      F20_ERROR_CODES.INSUFFICIENT_BALANCE,
      `Insufficient free balance: amount=${params.amount} free=${params.freeBalance}`,
    );
  }
}
