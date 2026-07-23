// Pure business rules for the cash-fund-lifecycle feature (F02). No Prisma,
// no Next.js, no I/O — fully unit-testable in isolation.
import { Decimal } from "decimal.js";

import { CashFundError, F02_ERROR_CODES } from "./errors";
import type { CashFundStatus } from "./dto";

const ALLOWED_TRANSITIONS: Record<CashFundStatus, CashFundStatus[]> = {
  DRAFT: ["ACTIVE"],
  ACTIVE: ["INACTIVE"],
  INACTIVE: ["ACTIVE"],
};

// BR-F02-006: state machine. Only DRAFT->ACTIVE, ACTIVE->INACTIVE and
// INACTIVE->ACTIVE are valid; everything else (including no-op transitions)
// is invalid.
export function canTransition(
  from: CashFundStatus,
  to: CashFundStatus,
): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

// F05 SEAM: once F05 (membership/numbering) exists, this will check whether
// a first member number has actually been issued for the fund. In F02 no
// numbering feature exists yet, so this ALWAYS returns false — a
// `nextMemberNumber` of 1 means nothing has been issued, and nothing else
// can currently change it. Do NOT infer this from `nextMemberNumber` today;
// F05 owns the real implementation.
export function hasFirstNumber(fund: { nextMemberNumber: number }): boolean {
  void fund;
  return false;
}

// BR-F02-002/004: the fixed fee (monthlySavingAmount) is editable only while
// the fund is DRAFT and no first member number has been issued.
export function canEditFixedFee(fund: {
  status: CashFundStatus;
  nextMemberNumber: number;
}): boolean {
  return fund.status === "DRAFT" && !hasFirstNumber(fund);
}

// BR-F02-005: operational config (recommendedDay/maximumDay/
// maxAdvanceMonths/riskThreshold) is editable only while the fund is ACTIVE.
export function canEditOperationalConfig(fund: {
  status: CashFundStatus;
}): boolean {
  return fund.status === "ACTIVE";
}

// BR-F02-003: recommendedDay and maximumDay must be integers with
// 1 <= recommendedDay <= maximumDay <= 28 (28 is safe for every month,
// including February).
export function validateDayConfig(
  recommendedDay: number,
  maximumDay: number,
): void {
  const isValid =
    Number.isInteger(recommendedDay) &&
    Number.isInteger(maximumDay) &&
    recommendedDay >= 1 &&
    maximumDay <= 28 &&
    recommendedDay <= maximumDay;

  if (!isValid) {
    throw new CashFundError(
      F02_ERROR_CODES.INVALID_DAY_CONFIG,
      `Invalid day config: recommendedDay=${recommendedDay}, maximumDay=${maximumDay}`,
    );
  }
}

// Money is always represented as a decimal string at the module boundary;
// this guards the fixed fee (and any other amount) must be strictly > 0.
export function validatePositiveAmount(amount: string): void {
  let value: Decimal;
  try {
    value = new Decimal(amount);
  } catch {
    throw new CashFundError(
      F02_ERROR_CODES.INVALID_INPUT,
      `Invalid amount: ${amount}`,
    );
  }
  if (!value.isFinite() || value.lte(0)) {
    throw new CashFundError(
      F02_ERROR_CODES.INVALID_INPUT,
      `Amount must be greater than 0: ${amount}`,
    );
  }
}

// officialStartDate crosses the module boundary as a date-only string
// (YYYY-MM-DD), but Prisma's `DateTime @db.Date` column rejects a bare date
// string ("premature end of input. Expected ISO-8601 DateTime.") — it needs a
// Date or a full ISO-8601 datetime. Normalize to UTC midnight at the boundary.
export function toDbDate(value: string | null | undefined): Date | null {
  if (value === null || value === undefined) {
    return null;
  }
  return new Date(`${value}T00:00:00.000Z`);
}
