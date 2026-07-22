// Stable, F02-prefixed error codes for the cash-fund-lifecycle feature. This
// is the contract the UI and API layers depend on; callers never couple to
// Prisma error shapes or internal exception types.
export const F02_ERROR_CODES = {
  INVALID_INPUT: "F02_INVALID_INPUT",
  UNAUTHORIZED: "F02_UNAUTHORIZED",
  CASH_FUND_NOT_FOUND: "F02_CASH_FUND_NOT_FOUND",
  CASH_FUND_INACTIVE: "F02_CASH_FUND_INACTIVE",
  CASH_FUND_FIXED_FEE_LOCKED: "F02_CASH_FUND_FIXED_FEE_LOCKED",
  INVALID_STATE_TRANSITION: "F02_INVALID_STATE_TRANSITION",
  INVALID_DAY_CONFIG: "F02_INVALID_DAY_CONFIG",
  OPERATION_FAILED: "F02_OPERATION_FAILED",
} as const;

export type CashFundErrorCode =
  (typeof F02_ERROR_CODES)[keyof typeof F02_ERROR_CODES];

export class CashFundError extends Error {
  readonly code: CashFundErrorCode;

  constructor(
    code: CashFundErrorCode,
    message?: string,
    options?: { cause?: unknown },
  ) {
    super(message ?? code, options);
    this.name = "CashFundError";
    this.code = code;
  }
}

// Funnel for unexpected failures (Prisma errors, etc.) so callers only ever
// see stable F02 codes; a CashFundError raised deliberately passes through
// untouched.
export function mapUnexpectedError(error: unknown): CashFundError {
  if (error instanceof CashFundError) {
    return error;
  }
  return new CashFundError(
    F02_ERROR_CODES.OPERATION_FAILED,
    error instanceof Error ? error.message : "Cash fund operation failed",
    { cause: error },
  );
}
