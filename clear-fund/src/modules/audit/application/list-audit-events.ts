import { prisma } from "@/lib/db";

import { toAuditEventDto, type AuditEventPageDto } from "../domain/dto";
import { AuditError, F23_ERROR_CODES, mapUnexpectedError } from "../domain/errors";
import type { AuditScope } from "../domain/rules";
import { listAuditEventsSchema, type ListAuditEventsInput } from "../schemas";
import { resolveScopeForCaller } from "./authorize";
import type { RequestContext } from "./context";

// Translates the authorization scope into a Prisma filter.
//
// ALL (Super Admin, no fund requested) applies no fund filter, so global events
// (cashFundId = null) are included. FUNDS restricts to an explicit id list,
// which naturally EXCLUDES global events — a treasurer must never see them
// (AC-F23-003, ADR-013). An empty list yields `in: []`, i.e. no rows.
function scopeFilter(scope: AuditScope) {
  if (scope.kind === "ALL") {
    return {};
  }
  if (scope.kind === "FUNDS") {
    return { cashFundId: { in: scope.cashFundIds } };
  }
  // FORBIDDEN never reaches here (resolveScopeForCaller throws first), but
  // failing closed to "no rows" keeps the filter safe if that ever changes.
  return { cashFundId: { in: [] as string[] } };
}

// FR-F23-001 / FR-F23-002: the audit log, global or per fund, newest first.
export async function listAuditEvents(
  input: ListAuditEventsInput,
  ctx: RequestContext,
): Promise<AuditEventPageDto> {
  const parsed = listAuditEventsSchema.safeParse(input);
  if (!parsed.success) {
    throw new AuditError(
      F23_ERROR_CODES.INVALID_INPUT,
      "Invalid audit log query",
      { cause: parsed.error },
    );
  }

  const query = parsed.data;
  const { scope } = await resolveScopeForCaller(ctx, query.cashFundId ?? null);

  try {
    const where = {
      ...scopeFilter(scope),
      ...(query.action ? { action: query.action } : {}),
      ...(query.entityType ? { entityType: query.entityType } : {}),
      ...(query.entityId ? { entityId: query.entityId } : {}),
      ...(query.actorId ? { actorId: query.actorId } : {}),
    };

    const [rows, total] = await Promise.all([
      prisma.auditEvent.findMany({
        where,
        // `id` breaks ties: occurredAt has millisecond resolution, so two events
        // written in the same transaction can share a timestamp and would
        // otherwise paginate non-deterministically.
        orderBy: [{ occurredAt: "desc" }, { id: "desc" }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      prisma.auditEvent.count({ where }),
    ]);

    return {
      events: rows.map(toAuditEventDto),
      total,
      page: query.page,
      pageSize: query.pageSize,
    };
  } catch (error) {
    throw mapUnexpectedError(error);
  }
}
