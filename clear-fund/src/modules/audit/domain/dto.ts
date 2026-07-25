// Output DTOs for the audit-log feature. Use cases return these instead of raw
// Prisma rows so the module boundary never leaks Prisma's internal shape.

import type { AuditChangeSet, AuditFieldChange, AuditValue } from "./rules";

export interface AuditEventDto {
  id: string;
  // Actor snapshot, frozen at event time (ADR-013). Nullable so a future
  // system/job actor (F24) can be recorded without a user row.
  actorId: string | null;
  actorEmail: string | null;
  actorRole: string | null;
  occurredAt: string;
  // Null for global events such as USER_CREATED.
  cashFundId: string | null;
  entityType: string;
  entityId: string;
  action: string;
  reason: string | null;
  changes: AuditChangeSet | null;
  relatedEventId: string | null;
  correlationId: string | null;
}

// Structural shape of an audit_event row (no Prisma types imported here so the
// domain stays framework-free). `changes` arrives as Prisma's JsonValue.
interface AuditEventLike {
  id: string;
  actorId: string | null;
  actorEmail: string | null;
  actorRole: string | null;
  occurredAt: Date | string;
  cashFundId: string | null;
  entityType: string;
  entityId: string;
  action: string;
  reason: string | null;
  changes: unknown;
  relatedEventId: string | null;
  correlationId: string | null;
}

function isAuditValue(value: unknown): value is AuditValue {
  return (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  );
}

// Validates the persisted JSON back into an AuditChangeSet. A row written by a
// future feature (or by hand) could hold a different shape; anything that does
// not match is dropped rather than trusted, so the detail view never renders
// arbitrary JSON as if it were a field diff.
export function parseChangeSet(value: unknown): AuditChangeSet | null {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const changes: AuditChangeSet = {};
  for (const [field, raw] of Object.entries(value as Record<string, unknown>)) {
    if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
      continue;
    }
    const candidate = raw as Partial<AuditFieldChange>;
    if (isAuditValue(candidate.previous) && isAuditValue(candidate.next)) {
      changes[field] = {
        previous: candidate.previous,
        next: candidate.next,
      };
    }
  }

  return Object.keys(changes).length === 0 ? null : changes;
}

export function toAuditEventDto(row: AuditEventLike): AuditEventDto {
  return {
    id: row.id,
    actorId: row.actorId,
    actorEmail: row.actorEmail,
    actorRole: row.actorRole,
    occurredAt: new Date(row.occurredAt).toISOString(),
    cashFundId: row.cashFundId,
    entityType: row.entityType,
    entityId: row.entityId,
    action: row.action,
    reason: row.reason,
    changes: parseChangeSet(row.changes),
    relatedEventId: row.relatedEventId,
    correlationId: row.correlationId,
  };
}

// A page of audit events. `total` powers the pagination controls; the log grows
// without bound, so the UI never loads it whole.
export interface AuditEventPageDto {
  events: AuditEventDto[];
  total: number;
  page: number;
  pageSize: number;
}
