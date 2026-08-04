import { randomUUID } from "node:crypto";

import { Decimal } from "decimal.js";
import { beforeEach, describe, expect, it } from "vitest";

import { createTreasurer } from "@/modules/auth/application";
import { activateCashFund, createCashFund } from "@/modules/cash-funds/application";
import { getCashFundBalance, listCashMovements } from "@/modules/ledger/application";
import { F20_ERROR_CODES } from "@/modules/ledger/domain/errors";

import { prisma, resetDb, seedSuperAdmin, signIn } from "./helpers";

const ADMIN = { email: "admin@test.local", password: "admin-password-123" };
const TREASURER_A = {
  email: "tesorero-a@test.local",
  name: "Tesorero A",
  password: "treasurer-a-password-123",
};

const BASE_FUND = {
  name: "Caja Central",
  monthlySavingAmount: "50.00",
  recommendedDay: 5,
  maximumDay: 15,
  maxAdvanceMonths: 3,
  riskThreshold: 3,
};

async function adminContext() {
  await seedSuperAdmin(ADMIN);
  const auth = await signIn(ADMIN);
  return { headers: auth.authHeaders };
}

async function activeFund(ctx: { headers: Headers }, name = BASE_FUND.name) {
  const fund = await createCashFund({ ...BASE_FUND, name }, ctx);
  await activateCashFund({ cashFundId: fund.id }, ctx);
  return fund;
}

// F20 exposes no write use case (ADR-014/BR-F20-006): every movement here is
// inserted directly through Prisma, exactly as the producer features (F06,
// F08, F14, F17) will do once they wire the real write path.
async function insertMovement(params: {
  cashFundId: string;
  direction: "IN" | "OUT";
  amount: string;
  movementType?: string;
  actorId: string;
  actorEmail: string;
  actorRole: string;
}) {
  return prisma.cashMovement.create({
    data: {
      cashFundId: params.cashFundId,
      direction: params.direction,
      amount: params.amount,
      movementType: params.movementType ?? "SAVINGS_PAYMENT",
      sourceType: "PAYMENT",
      sourceId: randomUUID(),
      actorId: params.actorId,
      actorEmail: params.actorEmail,
      actorRole: params.actorRole,
    },
  });
}

beforeEach(async () => {
  await resetDb();
});

describe("F20 cash ledger and balances (integration)", () => {
  // AC-F20-001: a fund with a mix of IN/OUT movements reports a balance
  // matching the hand-computed sum.
  it("AC-F20-001: the recalculated balance matches a hand-computed sum of movements", async () => {
    const ctx = await adminContext();
    const fund = await activeFund(ctx);

    await insertMovement({
      cashFundId: fund.id,
      direction: "IN",
      amount: "150.00",
      actorId: "admin-1",
      actorEmail: ADMIN.email,
      actorRole: "SUPER_ADMIN",
    });
    await insertMovement({
      cashFundId: fund.id,
      direction: "IN",
      amount: "75.50",
      actorId: "admin-1",
      actorEmail: ADMIN.email,
      actorRole: "SUPER_ADMIN",
    });
    await insertMovement({
      cashFundId: fund.id,
      direction: "OUT",
      amount: "40.25",
      movementType: "EXPENSE",
      actorId: "admin-1",
      actorEmail: ADMIN.email,
      actorRole: "SUPER_ADMIN",
    });

    const expectedAccounting = new Decimal("150.00")
      .plus("75.50")
      .minus("40.25")
      .toFixed(2);

    const balance = await getCashFundBalance({ cashFundId: fund.id }, ctx);

    expect(balance.accountingBalance).toBe(expectedAccounting);
    expect(balance.committedBalance).toBe("0.00");
    expect(balance.freeBalance).toBe(expectedAccounting);
  });

  // MANDATORY GUARD: a fund with zero movements must report "0.00" on every
  // balance, not throw — this is the day-one state of every fund (ADR-014),
  // not an edge case. Regression for the Prisma `_sum.amount === null` trap.
  it("reports 0.00 / 0.00 / 0.00 for a fund with no movements", async () => {
    const ctx = await adminContext();
    const fund = await activeFund(ctx);

    const balance = await getCashFundBalance({ cashFundId: fund.id }, ctx);

    expect(balance).toMatchObject({
      accountingBalance: "0.00",
      committedBalance: "0.00",
      freeBalance: "0.00",
    });

    const page = await listCashMovements({ cashFundId: fund.id }, ctx);
    expect(page.total).toBe(0);
    expect(page.movements).toEqual([]);
  });

  // Isolation (acceptance.md NFR "no debe permitir acceso entre cajas"): a
  // treasurer assigned to fund A cannot read fund B's balance or movements,
  // and fund B's movements never leak into fund A's page.
  it("isolation: a treasurer assigned to fund A cannot access fund B's balance or ledger", async () => {
    const ctx = await adminContext();
    const fundA = await activeFund(ctx, "Caja A");
    const fundB = await activeFund(ctx, "Caja B");

    const treasurer = await createTreasurer(TREASURER_A, ctx);
    await prisma.cashFundUser.create({
      data: { cashFundId: fundA.id, userId: treasurer.id, status: "ACTIVE" },
    });

    await insertMovement({
      cashFundId: fundA.id,
      direction: "IN",
      amount: "100.00",
      actorId: "admin-1",
      actorEmail: ADMIN.email,
      actorRole: "SUPER_ADMIN",
    });
    await insertMovement({
      cashFundId: fundB.id,
      direction: "IN",
      amount: "999.00",
      actorId: "admin-1",
      actorEmail: ADMIN.email,
      actorRole: "SUPER_ADMIN",
    });

    const treasurerAuth = await signIn(TREASURER_A);
    const treasurerCtx = { headers: treasurerAuth.authHeaders };

    await expect(
      getCashFundBalance({ cashFundId: fundB.id }, treasurerCtx),
    ).rejects.toMatchObject({ code: F20_ERROR_CODES.UNAUTHORIZED });

    await expect(
      listCashMovements({ cashFundId: fundB.id }, treasurerCtx),
    ).rejects.toMatchObject({ code: F20_ERROR_CODES.UNAUTHORIZED });

    const ownPage = await listCashMovements({ cashFundId: fundA.id }, treasurerCtx);
    expect(ownPage.movements.every((m) => m.cashFundId === fundA.id)).toBe(true);
    expect(ownPage.movements.some((m) => m.amount === "999")).toBe(false);
  });

  // DB-level immutability: the trigger guards the real Prisma client, not
  // only raw SQL run outside the app (ADR-014, same precedent as BR-F23-003).
  it("the cash movement ledger cannot be updated or deleted through the app path", async () => {
    const ctx = await adminContext();
    const fund = await activeFund(ctx);
    const movement = await insertMovement({
      cashFundId: fund.id,
      direction: "IN",
      amount: "10.00",
      actorId: "admin-1",
      actorEmail: ADMIN.email,
      actorRole: "SUPER_ADMIN",
    });

    await expect(
      prisma.cashMovement.update({
        where: { id: movement.id },
        data: { amount: "999.00" },
      }),
    ).rejects.toThrow();

    await expect(
      prisma.cashMovement.delete({ where: { id: movement.id } }),
    ).rejects.toThrow();

    const stillThere = await prisma.cashMovement.findUnique({
      where: { id: movement.id },
    });
    expect(stillThere).not.toBeNull();
    expect(new Decimal(stillThere!.amount.toString()).eq("10.00")).toBe(true);
  });
});
