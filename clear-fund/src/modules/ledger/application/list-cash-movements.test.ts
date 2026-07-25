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
      amount: "100",
      direction: "IN",
    });
    expect(typeof page.movements[0]!.amount).toBe("string");
  });

  it("maps direction, movementType and date-range filters onto the where clause", async () => {
    await listCashMovements(
      {
        cashFundId: FUND_ID,
        direction: "OUT",
        movementType: "EXPENSE",
        fromDate: "2026-07-01",
        toDate: "2026-07-31",
      },
      { headers },
    );

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          cashFundId: FUND_ID,
          direction: "OUT",
          movementType: "EXPENSE",
          occurredAt: {
            gte: new Date("2026-07-01T00:00:00.000Z"),
            lt: new Date("2026-08-01T00:00:00.000Z"),
          },
        }),
      }),
    );
  });

  it("computes pagination skip/take from page and pageSize", async () => {
    await listCashMovements(
      { cashFundId: FUND_ID, page: 3, pageSize: 10 },
      { headers },
    );

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 20, take: 10 }),
    );
  });

  it("orders the ledger newest first", async () => {
    await listCashMovements({ cashFundId: FUND_ID }, { headers });

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ occurredAt: "desc" }, { id: "desc" }],
      }),
    );
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
