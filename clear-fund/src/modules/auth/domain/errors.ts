// Stable, F01-prefixed error codes for the auth-and-sessions feature. These are
// the contract the UI and API layers depend on; the underlying Better Auth
// error codes are mapped onto them so callers never couple to the library.
export const F01_ERROR_CODES = {
  INVALID_INPUT: "F01_INVALID_INPUT",
  UNAUTHORIZED: "F01_UNAUTHORIZED",
  EMAIL_TAKEN: "F01_EMAIL_TAKEN",
  USER_NOT_FOUND: "F01_USER_NOT_FOUND",
  CANNOT_MODIFY_SELF: "F01_CANNOT_MODIFY_SELF",
  OPERATION_FAILED: "F01_OPERATION_FAILED",
} as const;

export type AuthErrorCode =
  (typeof F01_ERROR_CODES)[keyof typeof F01_ERROR_CODES];

export class AuthError extends Error {
  readonly code: AuthErrorCode;

  constructor(
    code: AuthErrorCode,
    message?: string,
    options?: { cause?: unknown },
  ) {
    super(message ?? code, options);
    this.name = "AuthError";
    this.code = code;
  }
}

// Better Auth surfaces failures as errors whose `body.code` (or `code`) is a
// stable string. Map the ones F01 cares about; everything else is a generic
// operation failure so we never leak internal details.
const BETTER_AUTH_CODE_MAP: Record<string, AuthErrorCode> = {
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: F01_ERROR_CODES.EMAIL_TAKEN,
  USER_ALREADY_EXISTS: F01_ERROR_CODES.EMAIL_TAKEN,
  YOU_CANNOT_BAN_YOURSELF: F01_ERROR_CODES.CANNOT_MODIFY_SELF,
  YOU_CANNOT_REMOVE_YOURSELF: F01_ERROR_CODES.CANNOT_MODIFY_SELF,
  YOU_ARE_NOT_ALLOWED_TO_CREATE_USERS: F01_ERROR_CODES.UNAUTHORIZED,
  YOU_ARE_NOT_ALLOWED_TO_BAN_USERS: F01_ERROR_CODES.UNAUTHORIZED,
  YOU_ARE_NOT_ALLOWED_TO_REVOKE_USERS_SESSIONS: F01_ERROR_CODES.UNAUTHORIZED,
  YOU_ARE_NOT_ALLOWED_TO_LIST_USERS: F01_ERROR_CODES.UNAUTHORIZED,
  YOU_ARE_NOT_ALLOWED_TO_UPDATE_USERS: F01_ERROR_CODES.UNAUTHORIZED,
  YOU_ARE_NOT_ALLOWED_TO_GET_USER: F01_ERROR_CODES.UNAUTHORIZED,
  FORBIDDEN: F01_ERROR_CODES.UNAUTHORIZED,
  UNAUTHORIZED: F01_ERROR_CODES.UNAUTHORIZED,
};

function extractCode(error: unknown): string | undefined {
  if (typeof error === "object" && error !== null) {
    const body = (error as { body?: { code?: unknown } }).body;
    if (body && typeof body.code === "string") {
      return body.code;
    }
    const code = (error as { code?: unknown }).code;
    if (typeof code === "string") {
      return code;
    }
  }
  return undefined;
}

export function mapBetterAuthError(error: unknown): AuthError {
  if (error instanceof AuthError) {
    return error;
  }
  const code = extractCode(error);
  if (code && BETTER_AUTH_CODE_MAP[code]) {
    return new AuthError(BETTER_AUTH_CODE_MAP[code], code, { cause: error });
  }
  return new AuthError(
    F01_ERROR_CODES.OPERATION_FAILED,
    code ?? "Auth operation failed",
    { cause: error },
  );
}
