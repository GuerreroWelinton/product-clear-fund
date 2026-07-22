import { auth } from "@/lib/auth";

import { toUserDto, type UserDto } from "../domain/dto";
import { AuthError, F01_ERROR_CODES, mapBetterAuthError } from "../domain/errors";
import { enableUserSchema, type EnableUserInput } from "../schemas";
import type { RequestContext } from "./context";

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
    const result = await auth.api.unbanUser({
      body: { userId: parsed.data.userId },
      headers: ctx.headers,
    });
    return toUserDto(result.user);
  } catch (error) {
    throw mapBetterAuthError(error);
  }
}
