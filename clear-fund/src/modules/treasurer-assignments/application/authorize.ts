import { auth, ROLES } from "@/lib/auth";

import { AssignmentError, F03_ERROR_CODES } from "../domain/errors";
import type { RequestContext } from "./context";

type Session = Awaited<ReturnType<typeof auth.api.getSession>>;

// BR-F03-001: only a Super Admin administers treasurer assignments. Re-checked
// server-side on every call; never trust the client.
export async function requireSuperAdmin(
  ctx: RequestContext,
): Promise<NonNullable<Session>> {
  const session = await auth.api.getSession({ headers: ctx.headers });
  if (!session || session.user.role !== ROLES.SUPER_ADMIN) {
    throw new AssignmentError(
      F03_ERROR_CODES.UNAUTHORIZED,
      "Super Admin role required",
    );
  }
  return session;
}

// FR-F03-002: any authenticated user may ask which funds they can see. The
// caller identity comes from the session, never from the client.
export async function requireSession(
  ctx: RequestContext,
): Promise<NonNullable<Session>> {
  const session = await auth.api.getSession({ headers: ctx.headers });
  if (!session) {
    throw new AssignmentError(
      F03_ERROR_CODES.UNAUTHORIZED,
      "Authentication required",
    );
  }
  return session;
}
