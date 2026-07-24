import { Prisma, type PrismaClient } from "@/generated/prisma/client";

import type { AuditAction, AuditEntityType } from "../domain/event-types";
import { normalizeChangeSet, type AuditChangeSet } from "../domain/rules";

// The actor snapshot, frozen at event time (ADR-013): it records who the actor
// WAS, so a later rename or role change does not rewrite history. null means a
// non-user actor (a future scheduled job, F24).
export interface AuditActor {
  id: string;
  email: string | null;
  role: string | null;
}

// Just the slice of the Prisma client needed to append an event. Both the shared
// client and an interactive `$transaction` client satisfy it, which is what lets
// F02/F03 write the event inside the very transaction that applies the change
// (ADR-013).
export type AuditWriteClient = Pick<PrismaClient, "auditEvent">;

export interface RecordAuditEventInput {
  actor: AuditActor | null;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;
  // Omit (or null) for a global event with no fund — e.g. USER_CREATED.
  cashFundId?: string | null;
  reason?: string | null;
  changes?: AuditChangeSet | null;
  // BR-F23-005 linking, populated by F09/F20 via linkToOriginalEvent().
  relatedEventId?: string | null;
  correlationId?: string | null;
}

// BR-F23-001 / BR-F23-002: appends one immutable event. Returns the new event id
// so a caller can link a follow-up event to it.
//
// `client` is the caller's choice on purpose: pass a transaction client to make
// the event atomic with the change it describes (F02/F03), or the shared client
// when no shared transaction is possible (F01, whose writes go through Better
// Auth — see ADR-013).
//
// There is no update or delete counterpart, and none can be added: the database
// rejects both (BR-F23-003).
export async function recordAuditEvent(
  client: AuditWriteClient,
  input: RecordAuditEventInput,
): Promise<string> {
  const changes = input.changes ? normalizeChangeSet(input.changes) : null;

  const { id } = await client.auditEvent.create({
    data: {
      actorId: input.actor?.id ?? null,
      actorEmail: input.actor?.email ?? null,
      actorRole: input.actor?.role ?? null,
      cashFundId: input.cashFundId ?? null,
      entityType: input.entityType,
      entityId: input.entityId,
      action: input.action,
      reason: input.reason ?? null,
      // A nullable Json column rejects a literal `null` (Prisma treats it as
      // ambiguous); Prisma.DbNull is how you store SQL NULL there.
      //
      // The cast bridges AuditChangeSet to Prisma's InputJsonValue: the domain
      // type uses a required-property index signature while InputJsonObject
      // declares optional ones, so they are structurally equivalent for JSON but
      // not assignable. AuditValue only ever holds JSON primitives, so the cast
      // is safe.
      changes: changes
        ? (changes as unknown as Prisma.InputJsonValue)
        : Prisma.DbNull,
      relatedEventId: input.relatedEventId ?? null,
      correlationId: input.correlationId ?? null,
    },
    select: { id: true },
  });

  return id;
}

// Builds the actor snapshot from a Better Auth session. Kept here so every
// audited feature records the actor identically.
export function auditActorFromSession(session: {
  user: { id: string; email?: string | null; role?: string | null };
}): AuditActor {
  return {
    id: session.user.id,
    email: session.user.email ?? null,
    role: session.user.role ?? null,
  };
}
