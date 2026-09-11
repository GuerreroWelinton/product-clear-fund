import { z } from "zod";

import { isoDateSchema } from "@/lib/dates";
import { PAGE_SIZE_DEFAULT, PAGE_SIZE_MAX } from "@/lib/pagination";

import { CASH_MOVEMENT_DIRECTIONS } from "../domain/movement-types";

// Sourced from the shared cap (src/lib/pagination): the ledger is one of the
// two append-only tables that limit applies to.
export const LEDGER_PAGE_SIZE_MAX = PAGE_SIZE_MAX;
export const LEDGER_PAGE_SIZE_DEFAULT = PAGE_SIZE_DEFAULT;

// ISO calendar date (YYYY-MM-DD); occurredAt filtering happens at day
// boundaries, not exact instants.
const isoDate = isoDateSchema;

const cashMovementDirection = z.enum([
  CASH_MOVEMENT_DIRECTIONS.IN,
  CASH_MOVEMENT_DIRECTIONS.OUT,
]);

// The chronological ledger (plan.md "Libro cronológico"), scoped to one fund.
export const listCashMovementsSchema = z
  .object({
    cashFundId: z.uuid(),
    // movementType is an open TEXT vocabulary (movement-types.ts); any
    // non-empty string is structurally valid input.
    movementType: z.string().min(1).optional(),
    direction: cashMovementDirection.optional(),
    fromDate: isoDate.optional(),
    toDate: isoDate.optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce
      .number()
      .int()
      .min(1)
      .max(LEDGER_PAGE_SIZE_MAX)
      .default(LEDGER_PAGE_SIZE_DEFAULT),
  })
  .refine(
    (value) =>
      value.fromDate === undefined ||
      value.toDate === undefined ||
      value.fromDate <= value.toDate,
    { message: "fromDate must not be after toDate", path: ["fromDate"] },
  );
export type ListCashMovementsInput = z.input<typeof listCashMovementsSchema>;
export type ListCashMovementsQuery = z.output<typeof listCashMovementsSchema>;

// The three balance cards (plan.md "Tarjetas de saldo").
export const getCashFundBalanceSchema = z.object({
  cashFundId: z.uuid(),
});
export type GetCashFundBalanceInput = z.infer<typeof getCashFundBalanceSchema>;
