-- CreateEnum
CREATE TYPE "CashMovementDirection" AS ENUM ('IN', 'OUT');

-- CreateTable
CREATE TABLE "cash_movement" (
    "id" TEXT NOT NULL,
    "cashFundId" TEXT NOT NULL,
    "direction" "CashMovementDirection" NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "movementType" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "reversedMovementId" TEXT,
    "relatedEventId" TEXT,
    "correlationId" TEXT,
    "actorId" TEXT NOT NULL,
    "actorEmail" TEXT NOT NULL,
    "actorRole" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cash_movement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cash_movement_cashFundId_occurredAt_idx" ON "cash_movement"("cashFundId", "occurredAt");

-- CreateIndex
CREATE INDEX "cash_movement_cashFundId_movementType_idx" ON "cash_movement"("cashFundId", "movementType");

-- CreateIndex
CREATE INDEX "cash_movement_correlationId_idx" ON "cash_movement"("correlationId");

-- AddForeignKey
ALTER TABLE "cash_movement" ADD CONSTRAINT "cash_movement_cashFundId_fkey" FOREIGN KEY ("cashFundId") REFERENCES "cash_fund"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Amount check (DATABASE_CONSTRAINTS.md:16 "montos mayores que cero"). The
-- direction column carries the sign, so amount itself must always be > 0.
ALTER TABLE "cash_movement" ADD CONSTRAINT "cash_movement_amount_positive"
  CHECK ("amount" > 0);

-- One movement can never be reversed twice: at most one row may point at a
-- given reversedMovementId.
CREATE UNIQUE INDEX "cash_movement_reversedMovementId_key"
  ON "cash_movement"("reversedMovementId")
  WHERE "reversedMovementId" IS NOT NULL;

-- Immutability (F20 / ADR-004, DATABASE_CONSTRAINTS.md:30 "CashMovement no se
-- elimina ni reescribe"). Same structure as audit_event_immutable() (F23):
-- a trigger, not a REVOKE, because table privileges do not bind the owner.
CREATE OR REPLACE FUNCTION cash_movement_immutable()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION
    'cash_movement is append-only: % is not allowed (F20/ADR-004)', TG_OP
    USING ERRCODE = 'restrict_violation';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cash_movement_no_update
  BEFORE UPDATE ON "cash_movement"
  FOR EACH ROW EXECUTE FUNCTION cash_movement_immutable();

CREATE TRIGGER cash_movement_no_delete
  BEFORE DELETE ON "cash_movement"
  FOR EACH ROW EXECUTE FUNCTION cash_movement_immutable();
