import { auth, type RequestContext } from "@/lib/auth";
import { buildChangeSet } from "@/modules/audit/domain/rules";

import { toUserDto, type UserDto } from "../domain/dto";
import { AuthError, F01_ERROR_CODES, mapBetterAuthError } from "../domain/errors";
import { enableUserSchema, type EnableUserInput } from "../schemas";
import {
  AUDIT_ACTIONS,
  loadUserAuditState,
  recordUserEvent,
  resolveAuditActor,
} from "./audit";

// Re-enables a previously disabled account (unban). The user can sign in again;
// they still have no active sessions until they do.
export async function enableUser(
  input: EnableUserInput,
  ctx: RequestContext,
): Promise<UserDto> {
  const parsed = enableUserSchema.safeParse(input);
  if (!parsed.success) {
    throw new AuthError(F01_ERROR_CODES.INVALID_INPUT, "Invalid enable input", {
      cause: parsed.error,
    });
  }

  try {
    const actor = await resolveAuditActor(ctx);
    const before = await loadUserAuditState(parsed.data.userId);

    const result = await auth.api.unbanUser({
      body: { userId: parsed.data.userId },
      headers: ctx.headers,
    });

    await recordUserEvent({
      actor,
      action: AUDIT_ACTIONS.USER_ENABLED,
      userId: parsed.data.userId,
      changes: buildChangeSet(
        {
          banned: before?.banned ?? true,
          banReason: before?.banReason ?? null,
        },
        { banned: false, banReason: null },
      ),
    });

    return toUserDto(result.user);
  } catch (error) {
    throw mapBetterAuthError(error);
  }
}
