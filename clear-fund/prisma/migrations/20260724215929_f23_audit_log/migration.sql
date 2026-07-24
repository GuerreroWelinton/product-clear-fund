-- CreateTable
CREATE TABLE "audit_event" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "actorEmail" TEXT,
    "actorRole" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cashFundId" TEXT,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "reason" TEXT,
    "changes" JSONB,
    "relatedEventId" TEXT,
    "correlationId" TEXT,

    CONSTRAINT "audit_event_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_event_cashFundId_occurredAt_idx" ON "audit_event"("cashFundId", "occurredAt");

-- CreateIndex
CREATE INDEX "audit_event_occurredAt_idx" ON "audit_event"("occurredAt");

-- CreateIndex
CREATE INDEX "audit_event_entityType_entityId_idx" ON "audit_event"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_event_actorId_idx" ON "audit_event"("actorId");

-- CreateIndex
CREATE INDEX "audit_event_correlationId_idx" ON "audit_event"("correlationId");

-- Immutability (F23 / BR-F23-003, ADR-013)
--
-- The audit trail is append-only. This is enforced in the database rather than
-- only by the absence of update/delete use cases, so no code path — including a
-- direct Prisma call — can rewrite history.
--
-- A trigger is used instead of REVOKE UPDATE, DELETE because Postgres table
-- privileges do not apply to the table owner, and the application role owns the
-- schema in the current deployment; a REVOKE would give a false sense of
-- immutability. Row-level triggers are enforced for the owner too.
--
-- Scope: blocks row UPDATE and DELETE, the only paths the application can take.
-- TRUNCATE is not blocked (it does not fire FOR EACH ROW triggers) because the
-- integration fixtures need it, and any role able to TRUNCATE can also DROP the
-- trigger — guarding it would break tests without adding real defense.
CREATE OR REPLACE FUNCTION audit_event_immutable()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION
    'audit_event is append-only: % is not allowed (F23/BR-F23-003)', TG_OP
    USING ERRCODE = 'restrict_violation';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_event_no_update
  BEFORE UPDATE ON "audit_event"
  FOR EACH ROW EXECUTE FUNCTION audit_event_immutable();

CREATE TRIGGER audit_event_no_delete
  BEFORE DELETE ON "audit_event"
  FOR EACH ROW EXECUTE FUNCTION audit_event_immutable();
