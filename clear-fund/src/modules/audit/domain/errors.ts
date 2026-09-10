import { createUnexpectedErrorMapper } from "@/lib/actions";

// Stable, F23-prefixed error codes for the audit-log feature. This is the
// contract the UI and API layers depend on; callers never couple to Prisma
// error shapes or internal exception types.
//
// Note (ADR-013): the retroactive wiring does NOT change the error codes of the
// audited features. When recording an event fails inside F01/F02/F03, the host
// feature's own code (F01_*/F02_*/F03_*) is what surfaces, because from the
// user's perspective the operation that failed is theirs.
export const F23_ERROR_CODES = {
  INVALID_INPUT: "F23_INVALID_INPUT",
  UNAUTHORIZED: "F23_UNAUTHORIZED",
  FORBIDDEN_CASH_FUND: "F23_FORBIDDEN_CASH_FUND",
  EVENT_NOT_FOUND: "F23_EVENT_NOT_FOUND",
  OPERATION_FAILED: "F23_OPERATION_FAILED",
} as const;

export type AuditErrorCode =
  (typeof F23_ERROR_CODES)[keyof typeof F23_ERROR_CODES];

export class AuditError extends Error {
  readonly code: AuditErrorCode;

  constructor(
    code: AuditErrorCode,
    message?: string,
    options?: { cause?: unknown },
  ) {
    super(message ?? code, options);
    this.name = "AuditError";
    this.code = code;
  }
}

// Funnel for unexpected failures (Prisma errors, etc.) so callers only ever see
// stable F23 codes; an AuditError raised deliberately passes through untouched.
export const mapUnexpectedError = createUnexpectedErrorMapper(
  AuditError,
  F23_ERROR_CODES.OPERATION_FAILED,
  "Audit operation failed",
);
