import { auth } from "@/lib/auth";

import { AuthError, F01_ERROR_CODES, mapBetterAuthError } from "../domain/errors";
import {
  revokeUserSessionsSchema,
  type RevokeUserSessionsInput,
} from "../schemas";
import type { RequestContext } from "./context";

export interface RevokeResult {
  success: boolean;
}

// FR-F01-002 (admin side): force-revoke all of a user's active sessions.
export async function revokeUserSessions(
  input: RevokeUserSessionsInput,
  ctx: RequestContext,
): Promise<RevokeResult> {
  const parsed = revokeUserSessionsSchema.safeParse(input);
  if (!parsed.success) {
    throw new AuthError(F01_ERROR_CODES.INVALID_INPUT, "Invalid revoke input", {
      cause: parsed.error,
    });
  }

  try {
    await auth.api.revokeUserSessions({
      body: { userId: parsed.data.userId },
      headers: ctx.headers,
    });
    return { success: true };
  } catch (error) {
    throw mapBetterAuthError(error);
  }
}
