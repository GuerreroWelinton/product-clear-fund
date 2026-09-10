import type { RequestContext } from "@/lib/auth";
import { prisma } from "@/lib/db";

import { toAuditEventDto, type AuditEventDto } from "../domain/dto";
import { AuditError, F23_ERROR_CODES, mapUnexpectedError } from "../domain/errors";
import { isEventVisible } from "../domain/rules";
import { getAuditEventSchema, type GetAuditEventInput } from "../schemas";
import { resolveScopeForCaller } from "./authorize";

// FR-F23-003: one event in full, so previous and new values can be compared.
//
// The row is loaded by id and access is checked afterwards against the caller's
// scope, because the fund an event belongs to is only known once it is read. A
// caller who may not see the event gets EVENT_NOT_FOUND rather than a forbidden
// error: distinguishing the two would confirm that an event with that id exists
// in a fund they cannot access.
export async function getAuditEvent(
  input: GetAuditEventInput,
  ctx: RequestContext,
): Promise<AuditEventDto> {
  const parsed = getAuditEventSchema.safeParse(input);
  if (!parsed.success) {
    throw new AuditError(
      F23_ERROR_CODES.INVALID_INPUT,
      "Invalid audit event id",
      { cause: parsed.error },
    );
  }

  // Scope is resolved without a requested fund: the caller's full visibility.
  const { scope } = await resolveScopeForCaller(ctx, null);

  try {
    const row = await prisma.auditEvent.findUnique({
      where: { id: parsed.data.id },
    });

    if (!row || !isEventVisible(scope, row)) {
      throw new AuditError(
        F23_ERROR_CODES.EVENT_NOT_FOUND,
        "Audit event not found",
      );
    }

    return toAuditEventDto(row);
  } catch (error) {
    throw mapUnexpectedError(error);
  }
}
