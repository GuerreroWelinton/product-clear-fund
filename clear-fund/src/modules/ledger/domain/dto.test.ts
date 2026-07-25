import { describe, expect, it } from "vitest";

import { toCashMovementDto } from "./dto";

describe("toCashMovementDto", () => {
  it("normalizes the row into the module's stable output shape", () => {
    const dto = toCashMovementDto({
      id: "movement-1",
      cashFundId: "fund-1",
      direction: "IN",
      amount: { toString: () => "150.50" },
      movementType: "SAVINGS_PAYMENT",
      sourceType: "PAYMENT",
      sourceId: "payment-1",
      reversedMovementId: null,
      relatedEventId: "event-1",
      correlationId: "event-1",
      actorId: "user-1",
      actorEmail: "tesorero@example.com",
      actorRole: "TREASURER",
      occurredAt: new Date("2026-03-01T12:00:00.000Z"),
    });

    expect(dto).toEqual({
      id: "movement-1",
      cashFundId: "fund-1",
      direction: "IN",
      amount: "150.50",
      movementType: "SAVINGS_PAYMENT",
      sourceType: "PAYMENT",
      sourceId: "payment-1",
      reversedMovementId: null,
      relatedEventId: "event-1",
      correlationId: "event-1",
      actorId: "user-1",
      actorEmail: "tesorero@example.com",
      actorRole: "TREASURER",
      occurredAt: "2026-03-01T12:00:00.000Z",
    });
  });

  it("passes an amount that already crosses as a decimal string through", () => {
    // Prisma's Decimal and decimal.js both expose toString(); Prisma is not
    // imported here (domain stays framework-free).
    const dto = toCashMovementDto({
      id: "movement-2",
      cashFundId: "fund-1",
      direction: "OUT",
      amount: { toString: () => "999999999999.98" },
      movementType: "LOAN_DISBURSEMENT",
      sourceType: "LOAN",
      sourceId: "loan-1",
      reversedMovementId: null,
      relatedEventId: null,
      correlationId: null,
      actorId: "user-1",
      actorEmail: "tesorero@example.com",
      actorRole: "TREASURER",
      occurredAt: "2026-03-01T12:00:00.000Z",
    });

    expect(dto.amount).toBe("999999999999.98");
  });

  it("keeps reversedMovementId populated when a reversal points back at it", () => {
    const dto = toCashMovementDto({
      id: "movement-3",
      cashFundId: "fund-1",
      direction: "IN",
      amount: { toString: () => "50.00" },
      movementType: "REVERSAL",
      sourceType: "CASH_MOVEMENT",
      sourceId: "movement-2",
      reversedMovementId: "movement-2",
      relatedEventId: null,
      correlationId: null,
      actorId: "user-1",
      actorEmail: "tesorero@example.com",
      actorRole: "TREASURER",
      occurredAt: "2026-03-02T12:00:00.000Z",
    });

    expect(dto.reversedMovementId).toBe("movement-2");
  });
});
