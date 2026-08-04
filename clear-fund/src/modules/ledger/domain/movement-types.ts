// Cash-movement vocabulary (F20 / ADR-014). `direction` is a real Prisma
// enum; `movementType` and `sourceType` are open TEXT columns (like
// AuditEvent.action) so a future producer feature adds its own value without
// a migration — only values already backed by a real write are declared here.

export const CASH_MOVEMENT_DIRECTIONS = {
  IN: "IN",
  OUT: "OUT",
} as const;

export type CashMovementDirection =
  (typeof CASH_MOVEMENT_DIRECTIONS)[keyof typeof CASH_MOVEMENT_DIRECTIONS];

export const CASH_MOVEMENT_DIRECTION_LABELS: Record<
  CashMovementDirection,
  string
> = {
  IN: "Entrada",
  OUT: "Salida",
};

// One entry per producer on the roadmap: F06/F08 (savings/repayment), F14
// (disbursement), F17 (expense), F18 (distribution payout), F09 (reversal).
export const CASH_MOVEMENT_TYPES = {
  SAVINGS_PAYMENT: "SAVINGS_PAYMENT",
  LOAN_DISBURSEMENT: "LOAN_DISBURSEMENT",
  LOAN_REPAYMENT: "LOAN_REPAYMENT",
  EXPENSE: "EXPENSE",
  DISTRIBUTION_PAYOUT: "DISTRIBUTION_PAYOUT",
  REVERSAL: "REVERSAL",
} as const;

export type CashMovementType =
  (typeof CASH_MOVEMENT_TYPES)[keyof typeof CASH_MOVEMENT_TYPES];

export const CASH_MOVEMENT_TYPE_LABELS: Record<CashMovementType, string> = {
  SAVINGS_PAYMENT: "Pago de ahorro",
  LOAN_DISBURSEMENT: "Desembolso de préstamo",
  LOAN_REPAYMENT: "Pago de cuota de préstamo",
  EXPENSE: "Gasto",
  DISTRIBUTION_PAYOUT: "Pago de reparto",
  REVERSAL: "Reversa",
};

// The entity each movement type traces back to (FR-F20-002): Payment (F08),
// Loan (F14), Expense (F17), DistributionAllocation (F18), CashMovement (F09
// reversal points at the original movement it reverses).
export const CASH_MOVEMENT_SOURCE_TYPES = {
  PAYMENT: "PAYMENT",
  LOAN: "LOAN",
  EXPENSE: "EXPENSE",
  DISTRIBUTION_ALLOCATION: "DISTRIBUTION_ALLOCATION",
  CASH_MOVEMENT: "CASH_MOVEMENT",
} as const;

export type CashMovementSourceType =
  (typeof CASH_MOVEMENT_SOURCE_TYPES)[keyof typeof CASH_MOVEMENT_SOURCE_TYPES];

export const CASH_MOVEMENT_SOURCE_TYPE_LABELS: Record<
  CashMovementSourceType,
  string
> = {
  PAYMENT: "Pago",
  LOAN: "Préstamo",
  EXPENSE: "Gasto",
  DISTRIBUTION_ALLOCATION: "Asignación de reparto",
  CASH_MOVEMENT: "Movimiento de caja",
};

export function isKnownCashMovementType(
  value: string,
): value is CashMovementType {
  return value in CASH_MOVEMENT_TYPE_LABELS;
}

export function cashMovementTypeLabel(value: string): string {
  return isKnownCashMovementType(value)
    ? CASH_MOVEMENT_TYPE_LABELS[value]
    : value;
}

export function isKnownCashMovementSourceType(
  value: string,
): value is CashMovementSourceType {
  return value in CASH_MOVEMENT_SOURCE_TYPE_LABELS;
}

export function cashMovementSourceTypeLabel(value: string): string {
  return isKnownCashMovementSourceType(value)
    ? CASH_MOVEMENT_SOURCE_TYPE_LABELS[value]
    : value;
}
