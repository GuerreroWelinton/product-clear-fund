import { auth, type RequestContext } from "@/lib/auth";
import { buildChangeSet } from "@/modules/audit/domain/rules";

import { toUserDto, type UserDto } from "../domain/dto";
import { AuthError, F01_ERROR_CODES, mapBetterAuthError } from "../domain/errors";
import { disableUserSchema, type DisableUserInput } from "../schemas";
import {
  AUDIT_ACTIONS,
  loadUserAuditState,
  recordUserEvent,
  resolveAuditActor,
} from "./audit";

// FR-F01-003 / BR-F01-004: disabling an account bans it AND revokes every
// active session so the user is locked out immediately.
export async function disableUser(
  input: DisableUserInput,
  ctx: RequestContext,
): Promise<UserDto> {
  const parsed = disableUserSchema.safeParse(input);
  if (!parsed.success) {
    throw new AuthError(F01_ERROR_CODES.INVALID_INPUT, "Invalid disable input", {
      cause: parsed.error,
    });
  }

  try {
    // Resolved before the operation: banning revokes sessions, and the actor may
    // in principle be the target.
    const actor = await resolveAuditActor(ctx);
    const before = await loadUserAuditState(parsed.data.userId);

    const result = await auth.api.banUser({
      body: {
        userId: parsed.data.userId,
        ...(parsed.data.banReason ? { banReason: parsed.data.banReason } : {}),
      },
      headers: ctx.headers,
    });
    await auth.api.revokeUserSessions({
      body: { userId: parsed.data.userId },
      headers: ctx.headers,
    });

    // F23 / AC-F23-001: this event carries previous value, new value, reason and
    // actor — the mechanism the cédula scenario asks for, verified here because
    // Person belongs to F04 (ADR-013, section 8). Disabling also revokes every
    // session (BR-F01-004), so activeSessions drops to 0 in the same change set.
    await recordUserEvent({
      actor,
      action: AUDIT_ACTIONS.USER_DISABLED,
      userId: parsed.data.userId,
      reason: parsed.data.banReason ?? null,
      changes: buildChangeSet(
        {
          banned: before?.banned ?? false,
          banReason: before?.banReason ?? null,
          activeSessions: before?.activeSessions ?? 0,
        },
        {
          banned: true,
          banReason: parsed.data.banReason ?? null,
          activeSessions: 0,
        },
      ),
    });

    return toUserDto(result.user);
  } catch (error) {
    throw mapBetterAuthError(error);
  }
}
