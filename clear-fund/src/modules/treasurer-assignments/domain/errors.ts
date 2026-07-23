// Stable, F03-prefixed error codes for the treasurer-assignments feature. This
// is the contract the UI and API layers depend on; callers never couple to
// Prisma error shapes or internal exception types.
export const F03_ERROR_CODES = {
  INVALID_INPUT: "F03_INVALID_INPUT",
  UNAUTHORIZED: "F03_UNAUTHORIZED",
  CASH_FUND_NOT_FOUND: "F03_CASH_FUND_NOT_FOUND",
  USER_NOT_FOUND: "F03_USER_NOT_FOUND",
  NOT_A_TREASURER: "F03_NOT_A_TREASURER",
  ASSIGNMENT_NOT_FOUND: "F03_ASSIGNMENT_NOT_FOUND",
  OPERATION_FAILED: "F03_OPERATION_FAILED",
} as const;

export type AssignmentErrorCode =
  (typeof F03_ERROR_CODES)[keyof typeof F03_ERROR_CODES];

export class AssignmentError extends Error {
  readonly code: AssignmentErrorCode;

  constructor(
    code: AssignmentErrorCode,
    message?: string,
    options?: { cause?: unknown },
  ) {
    super(message ?? code, options);
    this.name = "AssignmentError";
    this.code = code;
  }
}

// Funnel for unexpected failures (Prisma errors, etc.) so callers only ever
// see stable F03 codes; an AssignmentError raised deliberately passes through
// untouched.
export function mapUnexpectedError(error: unknown): AssignmentError {
  if (error instanceof AssignmentError) {
    return error;
  }
  return new AssignmentError(
    F03_ERROR_CODES.OPERATION_FAILED,
    error instanceof Error ? error.message : "Treasurer assignment operation failed",
    { cause: error },
  );
}
