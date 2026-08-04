// Stable, F20-prefixed error codes for the cash-ledger-balance feature. This
// is the contract the UI and API layers depend on; callers never couple to
// Prisma error shapes or internal exception types.
export const F20_ERROR_CODES = {
  INVALID_INPUT: "F20_INVALID_INPUT",
  UNAUTHORIZED: "F20_UNAUTHORIZED",
  CASH_FUND_NOT_FOUND: "F20_CASH_FUND_NOT_FOUND",
  INSUFFICIENT_BALANCE: "F20_INSUFFICIENT_BALANCE",
  OPERATION_FAILED: "F20_OPERATION_FAILED",
} as const;

export type LedgerErrorCode =
  (typeof F20_ERROR_CODES)[keyof typeof F20_ERROR_CODES];

export class LedgerError extends Error {
  readonly code: LedgerErrorCode;

  constructor(
    code: LedgerErrorCode,
    message?: string,
    options?: { cause?: unknown },
  ) {
    super(message ?? code, options);
    this.name = "LedgerError";
    this.code = code;
  }
}

// Funnel for unexpected failures (Prisma errors, etc.) so callers only ever
// see stable F20 codes; a LedgerError raised deliberately passes through
// untouched.
export function mapUnexpectedError(error: unknown): LedgerError {
  if (error instanceof LedgerError) {
    return error;
  }
  return new LedgerError(
    F20_ERROR_CODES.OPERATION_FAILED,
    error instanceof Error ? error.message : "Ledger operation failed",
    { cause: error },
  );
}
