import { auth, type RequestContext } from "@/lib/auth";
import { buildChangeSet } from "@/modules/audit/domain/rules";

import { AuthError, F01_ERROR_CODES, mapBetterAuthError } from "../domain/errors";
import {
  revokeUserSessionsSchema,
  type RevokeUserSessionsInput,
} from "../schemas";
import {
  AUDIT_ACTIONS,
  loadUserAuditState,
  recordUserEvent,
  resolveAuditActor,
} from "./audit";

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
    const actor = await resolveAuditActor(ctx);
    const before = await loadUserAuditState(parsed.data.userId);

    await auth.api.revokeUserSessions({
      body: { userId: parsed.data.userId },
      headers: ctx.headers,
    });

    // The session count is what actually changed, so that is what the event
    // records — there is no user-column diff to show.
    await recordUserEvent({
      actor,
      action: AUDIT_ACTIONS.USER_SESSIONS_REVOKED,
      userId: parsed.data.userId,
      changes: buildChangeSet(
        { activeSessions: before?.activeSessions ?? 0 },
        { activeSessions: 0 },
      ),
    });

    return { success: true };
  } catch (error) {
    throw mapBetterAuthError(error);
  }
}
