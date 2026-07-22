import { auth, ROLES } from "@/lib/auth";

import { toUserDto, type UserDto } from "../domain/dto";
import { AuthError, F01_ERROR_CODES, mapBetterAuthError } from "../domain/errors";
import { createTreasurerSchema, type CreateTreasurerInput } from "../schemas";
import type { RequestContext } from "./context";

// FR-F01-001: a Super Admin creates treasurer accounts. Better Auth's admin
// plugin enforces (server-side, from the caller's headers) that only an admin
// may call this; we add input validation, a stable DTO and stable errors.
export async function createTreasurer(
  input: CreateTreasurerInput,
  ctx: RequestContext,
): Promise<UserDto> {
  const parsed = createTreasurerSchema.safeParse(input);
  if (!parsed.success) {
    throw new AuthError(F01_ERROR_CODES.INVALID_INPUT, "Invalid treasurer input", {
      cause: parsed.error,
    });
  }

  try {
    const result = await auth.api.createUser({
      body: {
        email: parsed.data.email,
        name: parsed.data.name,
        password: parsed.data.password,
        role: ROLES.TREASURER,
      },
      headers: ctx.headers,
    });
    return toUserDto(result.user);
  } catch (error) {
    throw mapBetterAuthError(error);
  }
}
