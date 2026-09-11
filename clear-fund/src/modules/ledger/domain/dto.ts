// Output DTOs: use cases return these, never raw Prisma rows. Money is always
// a decimal string.
import { toMoneyString } from "@/lib/money";

import type { CashMovementDirection } from "./movement-types";

export interface CashMovementDto {
  id: string;
  cashFundId: string;
  direction: CashMovementDirection;
  amount: string;
  movementType: string;
  sourceType: string;
  sourceId: string;
  reversedMovementId: string | null;
  relatedEventId: string | null;
  correlationId: string | null;
  actorId: string;
  actorEmail: string;
  actorRole: string;
  occurredAt: string;
}

// Structural row shape, so the domain imports no Prisma types.
interface CashMovementLike {
  id: string;
  cashFundId: string;
  direction: string;
  amount: { toString(): string };
  movementType: string;
  sourceType: string;
  sourceId: string;
  reversedMovementId: string | null;
  relatedEventId: string | null;
  correlationId: string | null;
  actorId: string;
  actorEmail: string;
  actorRole: string;
  occurredAt: Date | string;
}

export function toCashMovementDto(row: CashMovementLike): CashMovementDto {
  return {
    id: row.id,
    cashFundId: row.cashFundId,
    direction: row.direction as CashMovementDirection,
    amount: toMoneyString(row.amount.toString()),
    movementType: row.movementType,
    sourceType: row.sourceType,
    sourceId: row.sourceId,
    reversedMovementId: row.reversedMovementId,
    relatedEventId: row.relatedEventId,
    correlationId: row.correlationId,
    actorId: row.actorId,
    actorEmail: row.actorEmail,
    actorRole: row.actorRole,
    occurredAt: new Date(row.occurredAt).toISOString(),
  };
}

// A page of the chronological ledger. `total` powers pagination; the ledger
// grows without bound, so the UI never loads it whole.
export interface CashMovementPageDto {
  movements: CashMovementDto[];
  total: number;
  page: number;
  pageSize: number;
}

// The three derived balances (BR-F20-003/004/005), all decimal strings.
export interface CashFundBalanceDto {
  cashFundId: string;
  currency: string;
  accountingBalance: string;
  committedBalance: string;
  freeBalance: string;
}

// The ledger page header (finding 1, pass 2): just enough to name the fund,
// nothing structural — that belongs to cash-funds/application's own DTO.
export interface CashFundHeaderDto {
  cashFundId: string;
  name: string;
}
