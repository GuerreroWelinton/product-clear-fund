import { describe, expect, it } from "vitest";

import {
  CASH_MOVEMENT_DIRECTIONS,
  CASH_MOVEMENT_DIRECTION_LABELS,
  CASH_MOVEMENT_SOURCE_TYPES,
  CASH_MOVEMENT_SOURCE_TYPE_LABELS,
  CASH_MOVEMENT_TYPES,
  cashMovementSourceTypeLabel,
  cashMovementTypeLabel,
  isKnownCashMovementSourceType,
  isKnownCashMovementType,
} from "./movement-types";

describe("CASH_MOVEMENT_DIRECTION_LABELS", () => {
  it("labels IN and OUT in Spanish", () => {
    expect(CASH_MOVEMENT_DIRECTION_LABELS[CASH_MOVEMENT_DIRECTIONS.IN]).toBe(
      "Entrada",
    );
    expect(CASH_MOVEMENT_DIRECTION_LABELS[CASH_MOVEMENT_DIRECTIONS.OUT]).toBe(
      "Salida",
    );
  });

  it("is exhaustive over every declared direction", () => {
    for (const direction of Object.values(CASH_MOVEMENT_DIRECTIONS)) {
      expect(CASH_MOVEMENT_DIRECTION_LABELS[direction]).toBeTruthy();
    }
  });
});

describe("cashMovementTypeLabel", () => {
  it("is exhaustive over every declared movement type", () => {
    for (const type of Object.values(CASH_MOVEMENT_TYPES)) {
      expect(isKnownCashMovementType(type)).toBe(true);
      expect(cashMovementTypeLabel(type)).toBeTruthy();
    }
  });

  it("covers the roadmap producers named in F20's scope", () => {
    expect(CASH_MOVEMENT_TYPES.SAVINGS_PAYMENT).toBe("SAVINGS_PAYMENT");
    expect(CASH_MOVEMENT_TYPES.LOAN_DISBURSEMENT).toBe("LOAN_DISBURSEMENT");
    expect(CASH_MOVEMENT_TYPES.LOAN_REPAYMENT).toBe("LOAN_REPAYMENT");
    expect(CASH_MOVEMENT_TYPES.EXPENSE).toBe("EXPENSE");
    expect(CASH_MOVEMENT_TYPES.DISTRIBUTION_PAYOUT).toBe("DISTRIBUTION_PAYOUT");
    expect(CASH_MOVEMENT_TYPES.REVERSAL).toBe("REVERSAL");
  });

  it("falls back to the raw value for a type a future feature adds", () => {
    // movementType is TEXT in the database; an unknown value must not crash.
    expect(isKnownCashMovementType("SOMETHING_FUTURE")).toBe(false);
    expect(cashMovementTypeLabel("SOMETHING_FUTURE")).toBe("SOMETHING_FUTURE");
  });
});

describe("cashMovementSourceTypeLabel", () => {
  it("is exhaustive over every declared source type", () => {
    for (const type of Object.values(CASH_MOVEMENT_SOURCE_TYPES)) {
      expect(isKnownCashMovementSourceType(type)).toBe(true);
      expect(cashMovementSourceTypeLabel(type)).toBeTruthy();
    }
  });

  it("falls back to the raw value for a source type a future feature adds", () => {
    expect(isKnownCashMovementSourceType("SOMETHING_FUTURE")).toBe(false);
    expect(cashMovementSourceTypeLabel("SOMETHING_FUTURE")).toBe(
      "SOMETHING_FUTURE",
    );
  });

  it("has one label per Spanish name", () => {
    expect(CASH_MOVEMENT_SOURCE_TYPE_LABELS.PAYMENT).toBe("Pago");
    expect(CASH_MOVEMENT_SOURCE_TYPE_LABELS.LOAN).toBe("Préstamo");
    expect(CASH_MOVEMENT_SOURCE_TYPE_LABELS.EXPENSE).toBe("Gasto");
    expect(CASH_MOVEMENT_SOURCE_TYPE_LABELS.DISTRIBUTION_ALLOCATION).toBe(
      "Asignación de reparto",
    );
    expect(CASH_MOVEMENT_SOURCE_TYPE_LABELS.CASH_MOVEMENT).toBe(
      "Movimiento de caja",
    );
  });
});
