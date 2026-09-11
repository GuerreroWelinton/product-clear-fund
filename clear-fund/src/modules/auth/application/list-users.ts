import { auth, type RequestContext } from "@/lib/auth";

import { toUserDto, type UserDto } from "../domain/dto";
import { mapBetterAuthError } from "../domain/errors";

// Code review finding 1, pass 2: /users called `auth.api.listUsers` straight
// from the page, bypassing the auth module entirely — the same root cause
// finding 1 identified for cash-funds. This is that read use case.
//
// No explicit `requireSuperAdmin` guard here: Better Auth's admin plugin
// already enforces (server-side, from the caller's headers) that only an
// admin may list users — the same trust boundary create-treasurer.ts and
// disable-user.ts rely on for their writes. A forbidden caller comes back as
// `YOU_ARE_NOT_ALLOWED_TO_LIST_USERS`, already mapped to F01_UNAUTHORIZED
// below, so this enforces exactly what the page's direct call did before.
export async function listUsers(ctx: RequestContext): Promise<UserDto[]> {
  try {
    const { users } = await auth.api.listUsers({
      query: { limit: 200, sortBy: "createdAt", sortDirection: "desc" },
      headers: ctx.headers,
    });
    return users.map(toUserDto);
  } catch (error) {
    throw mapBetterAuthError(error);
  }
}
