import { businessDayEndExclusive, businessDayStart } from "@/lib/dates";
import { prisma } from "@/lib/db";

import { toCashMovementDto, type CashMovementPageDto } from "../domain/dto";
import { F20_ERROR_CODES, LedgerError, mapUnexpectedError } from "../domain/errors";
import {
  listCashMovementsSchema,
  type ListCashMovementsInput,
} from "../schemas";
import { requireSuperAdminOrAssignedTreasurer } from "./authorize";
import type { RequestContext } from "./context";

// `toDate` is inclusive at the day boundary (isoDate is a calendar date, not
// an instant): filtering is [fromDate 00:00, toDate+1day 00:00). The day
// boundaries come from the business timezone, matching the zone the ledger
// renders in — a UTC boundary pushes late-evening rows into the next day.
function dateRangeFilter(fromDate?: string, toDate?: string) {
  if (!fromDate && !toDate) {
    return undefined;
  }
  const range: { gte?: Date; lt?: Date } = {};
  if (fromDate) {
    range.gte = businessDayStart(fromDate);
  }
  if (toDate) {
    range.lt = businessDayEndExclusive(toDate);
  }
  return range;
}

// FR-F20-002 / plan.md "Libro cronológico": the chronological ledger, scoped
// to one fund, newest first.
export async function listCashMovements(
  input: ListCashMovementsInput,
  ctx: RequestContext,
): Promise<CashMovementPageDto> {
  const parsed = listCashMovementsSchema.safeParse(input);
  if (!parsed.success) {
    throw new LedgerError(
      F20_ERROR_CODES.INVALID_INPUT,
      "Invalid cash movement query",
      { cause: parsed.error },
    );
  }

  const query = parsed.data;
  await requireSuperAdminOrAssignedTreasurer(ctx, query.cashFundId);

  try {
    const occurredAt = dateRangeFilter(query.fromDate, query.toDate);
    const where = {
      cashFundId: query.cashFundId,
      ...(query.movementType ? { movementType: query.movementType } : {}),
      ...(query.direction ? { direction: query.direction } : {}),
      ...(occurredAt ? { occurredAt } : {}),
    };

    const [rows, total] = await Promise.all([
      prisma.cashMovement.findMany({
        where,
        // `id` breaks ties, same reasoning as F23's audit log: occurredAt can
        // collide within the same transaction.
        orderBy: [{ occurredAt: "desc" }, { id: "desc" }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      prisma.cashMovement.count({ where }),
    ]);

    return {
      movements: rows.map(toCashMovementDto),
      total,
      page: query.page,
      pageSize: query.pageSize,
    };
  } catch (error) {
    throw mapUnexpectedError(error);
  }
}
