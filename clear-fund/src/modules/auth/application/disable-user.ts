import { auth } from "@/lib/auth";

import { toUserDto, type UserDto } from "../domain/dto";
import { AuthError, F01_ERROR_CODES, mapBetterAuthError } from "../domain/errors";
import { disableUserSchema, type DisableUserInput } from "../schemas";
import type { RequestContext } from "./context";

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
    return toUserDto(result.user);
  } catch (error) {
    throw mapBetterAuthError(error);
  }
}
