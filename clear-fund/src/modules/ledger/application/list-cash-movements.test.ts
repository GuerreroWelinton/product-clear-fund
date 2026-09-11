import { Decimal } from "decimal.js";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getSession, findFirstAssignment, findMany, count } = vi.hoisted(() => ({
  getSession: vi.fn(),
  findFirstAssignment: vi.fn(),
  findMany: vi.fn(),
  count: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession } },
  ROLES: { SUPER_ADMIN: "SUPER_ADMIN", TREASURER: "TREASURER" },
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    cashFundUser: { findFirst: findFirstAssignment },
    cashMovement: { findMany, count },
  },
}));

import { F20_ERROR_CODES } from "../domain/errors";
import { listCashMovements } from "./list-cash-movements";

const headers = new Headers();
const superAdminSession = { user: { id: "admin-1", role: "SUPER_ADMIN" } };
const FUND_ID = "11111111-1111-4111-8111-111111111111";

const movementRow = {
  id: "movement-1",
  cashFundId: FUND_ID,
  direction: "IN",
  amount: new Decimal("100.00"),
  movementType: "SAVINGS_PAYMENT",
  sourceType: "PAYMENT",
  sourceId: "payment-1",
  reversedMovementId: null,
  relatedEventId: "event-1",
  correlationId: "corr-1",
  actorId: "actor-1",
  actorEmail: "actor@test.local",
  actorRole: "TREASURER",
  occurredAt: new Date("2026-07-20T10:00:00.000Z"),
};

beforeEach(() => {
  vi.clearAllMocks();
  getSession.mockResolvedValue(superAdminSession);
  findMany.mockResolvedValue([movementRow]);
  count.mockResolvedValue(1);
});

describe("listCashMovements", () => {
  it("returns a page of movements as DTOs, money as a string", async () => {
    const page = await listCashMovements({ cashFundId: FUND_ID }, { headers });

    expect(page.total).toBe(1);
    expect(page.movements).toHaveLength(1);
    expect(page.movements[0]).toMatchObject({
      id: "movement-1",
      amount: "100.00",
      direction: "IN",
    });
    expect(typeof page.movements[0]!.amount).toBe("string");
  });

  // Behavior, not call shape: the fake `findMany` applies the composed
  // `where` to a fixture set, so this fails if direction/movementType/date
  // mapping is wrong, not just if the where object's shape changes.
  it("returns only movements matching direction, movementType and date range", async () => {
    const matchingRow = {
      ...movementRow,
      id: "movement-match",
      direction: "OUT",
      movementType: "EXPENSE",
      occurredAt: new Date("2026-07-15T12:00:00.000Z"),
    };
    const wrongDirectionRow = { ...movementRow, id: "movement-wrong-direction" };
    const outsideRangeRow = {
      ...movementRow,
      id: "movement-outside-range",
      direction: "OUT",
      movementType: "EXPENSE",
      occurredAt: new Date("2026-08-01T12:00:00.000Z"),
    };
    const fixtureRows = [matchingRow, wrongDirectionRow, outsideRangeRow];

    findMany.mockImplementation(async ({ where }) =>
      fixtureRows.filter((row) => {
        if (where.direction && row.direction !== where.direction) return false;
        if (where.movementType && row.movementType !== where.movementType) {
          return false;
        }
        if (where.occurredAt) {
          const { gte, lt } = where.occurredAt as { gte?: Date; lt?: Date };
          if (gte && row.occurredAt < gte) return false;
          if (lt && row.occurredAt >= lt) return false;
        }
        return true;
      }),
    );

    const page = await listCashMovements(
      {
        cashFundId: FUND_ID,
        direction: "OUT",
        movementType: "EXPENSE",
        fromDate: "2026-07-01",
        toDate: "2026-07-31",
      },
      { headers },
    );

    expect(page.movements.map((m) => m.id)).toEqual([matchingRow.id]);
  });

  // Regression from F20 manual validation: a movement at 20:00 on June 30 in
  // Guayaquil is stored as 2026-07-01T01:00:00Z. Filtering up to June 30 must
  // keep it, because that is the day the ledger displays for it.
  it("includes a late-evening movement in the business day it is displayed under", async () => {
    await listCashMovements(
      { cashFundId: FUND_ID, toDate: "2026-06-30" },
      { headers },
    );

    const where = findMany.mock.calls[0]?.[0]?.where as {
      occurredAt: { lt: Date };
    };
    expect(where.occurredAt.lt.toISOString()).toBe("2026-07-01T05:00:00.000Z");
    expect(new Date("2026-07-01T01:00:00.000Z") < where.occurredAt.lt).toBe(
      true,
    );
  });

  // Behavior, not call shape: the fake `findMany` slices a 25-row fixture by
  // the passed skip/take, so this fails if the (page - 1) * pageSize formula
  // is wrong, not just if the call arguments' shape changes.
  it("returns the requested page slice for page and pageSize", async () => {
    const fixtureRows = Array.from({ length: 25 }, (_, index) => ({
      ...movementRow,
      id: `movement-${index}`,
    }));

    findMany.mockImplementation(async ({ skip, take }) =>
      fixtureRows.slice(skip, skip + take),
    );
    count.mockResolvedValue(fixtureRows.length);

    const page = await listCashMovements(
      { cashFundId: FUND_ID, page: 3, pageSize: 10 },
      { headers },
    );

    expect(page.movements.map((m) => m.id)).toEqual(
      fixtureRows.slice(20, 30).map((row) => row.id),
    );
  });

  // Behavior, not call shape: the fake `findMany` sorts a deliberately
  // unsorted fixture using the passed `orderBy`, so this fails if the
  // ledger stops requesting newest-first ordering, not just if the
  // orderBy argument's shape changes.
  it("orders the ledger newest first", async () => {
    const older = {
      ...movementRow,
      id: "movement-old",
      occurredAt: new Date("2026-01-01T00:00:00.000Z"),
    };
    const newer = {
      ...movementRow,
      id: "movement-new",
      occurredAt: new Date("2026-06-01T00:00:00.000Z"),
    };
    const fixtureRows = [older, newer];

    findMany.mockImplementation(async ({ orderBy = [] }) =>
      [...fixtureRows].sort((a, b) => {
        for (const clause of orderBy as Array<Record<string, "asc" | "desc">>) {
          const [field, direction] = Object.entries(clause)[0] as [
            "occurredAt" | "id",
            "asc" | "desc",
          ];
          if (a[field] < b[field]) return direction === "asc" ? -1 : 1;
          if (a[field] > b[field]) return direction === "asc" ? 1 : -1;
        }
        return 0;
      }),
    );

    const page = await listCashMovements({ cashFundId: FUND_ID }, { headers });

    expect(page.movements.map((m) => m.id)).toEqual([newer.id, older.id]);
  });

  it("rejects a treasurer without an assignment to the fund", async () => {
    getSession.mockResolvedValue({ user: { id: "t1", role: "TREASURER" } });
    findFirstAssignment.mockResolvedValue(null);

    await expect(
      listCashMovements({ cashFundId: FUND_ID }, { headers }),
    ).rejects.toMatchObject({ code: F20_ERROR_CODES.UNAUTHORIZED });
    expect(findMany).not.toHaveBeenCalled();
  });
});
