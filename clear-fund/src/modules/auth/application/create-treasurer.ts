import { auth, ROLES } from "@/lib/auth";
import { buildCreationChangeSet } from "@/modules/audit/domain/rules";

import { toUserDto, type UserDto } from "../domain/dto";
import { AuthError, F01_ERROR_CODES, mapBetterAuthError } from "../domain/errors";
import { createTreasurerSchema, type CreateTreasurerInput } from "../schemas";
import { AUDIT_ACTIONS, recordUserEvent, resolveAuditActor } from "./audit";
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
    const actor = await resolveAuditActor(ctx);

    const result = await auth.api.createUser({
      body: {
        email: parsed.data.email,
        name: parsed.data.name,
        password: parsed.data.password,
        role: ROLES.TREASURER,
      },
      headers: ctx.headers,
    });

    // F23 / BR-F23-004: `password` is listed on purpose. The change set records
    // THAT an initial password was set and redacts its value — the field name
    // matches the sensitive denylist, so "[REDACTED]" is stored, never the
    // secret.
    await recordUserEvent({
      actor,
      action: AUDIT_ACTIONS.USER_CREATED,
      userId: result.user.id,
      changes: buildCreationChangeSet({
        email: parsed.data.email,
        name: parsed.data.name,
        role: ROLES.TREASURER,
        password: parsed.data.password,
      }),
    });

    return toUserDto(result.user);
  } catch (error) {
    throw mapBetterAuthError(error);
  }
}
