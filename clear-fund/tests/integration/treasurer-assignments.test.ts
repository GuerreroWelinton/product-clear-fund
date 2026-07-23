import { beforeEach, describe, expect, it } from "vitest";

import { createTreasurer } from "@/modules/auth/application";
import {
  activateCashFund,
  createCashFund,
  updateOperationalConfig,
} from "@/modules/cash-funds/application";
import { F02_ERROR_CODES } from "@/modules/cash-funds/domain/errors";
import {
  assignTreasurer,
  listAssignedCashFunds,
  unassignTreasurer,
} from "@/modules/treasurer-assignments/application";

import { prisma, resetDb, seedSuperAdmin, signIn } from "./helpers";

const ADMIN = { email: "admin@test.local", password: "admin-password-123" };
const T1 = {
  email: "t1@test.local",
  name: "Tesorero Uno",
  password: "treasurer-one-123",
};
const T2 = {
  email: "t2@test.local",
  name: "Tesorero Dos",
  password: "treasurer-two-123",
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

// Creates a treasurer (via F01) and returns its id + an authenticated context.
async function makeTreasurer(
  adminCtx: { headers: Headers },
  creds: { email: string; name: string; password: string },
) {
  const treasurer = await createTreasurer(creds, adminCtx);
  const auth = await signIn(creds);
  return { id: treasurer.id, ctx: { headers: auth.authHeaders } };
}

async function activeFund(ctx: { headers: Headers }) {
  const fund = await createCashFund(BASE_FUND, ctx);
  await activateCashFund({ cashFundId: fund.id }, ctx);
  return fund;
}

beforeEach(async () => {
  await resetDb();
});

describe("F03 treasurer assignments (integration)", () => {
  // AC-F03-001: an unassigned treasurer cannot see or operate a fund.
  it("AC-F03-001: an unassigned treasurer is denied access to a fund", async () => {
    const ctx = await adminContext();
    const fund = await activeFund(ctx);
    const t = await makeTreasurer(ctx, T1);

    expect(await listAssignedCashFunds(t.ctx)).not.toContain(fund.id);

    await expect(
      updateOperationalConfig({ cashFundId: fund.id, riskThreshold: 9 }, t.ctx),
    ).rejects.toMatchObject({ code: F02_ERROR_CODES.UNAUTHORIZED });
  });

  // AC-F03-002: a fund with two treasurers lets either operate, each acting as
  // themselves. The FORMAL audit record of the actor is deferred to F23
  // (ADR-012); here we assert both are authorized and both assignments persist.
  it("AC-F03-002: two treasurers on one fund can both operate as themselves", async () => {
    const ctx = await adminContext();
    const fund = await activeFund(ctx);
    const t1 = await makeTreasurer(ctx, T1);
    const t2 = await makeTreasurer(ctx, T2);

    await assignTreasurer({ cashFundId: fund.id, userId: t1.id }, ctx);
    await assignTreasurer({ cashFundId: fund.id, userId: t2.id }, ctx);

    expect(await listAssignedCashFunds(t1.ctx)).toContain(fund.id);
    expect(await listAssignedCashFunds(t2.ctx)).toContain(fund.id);

    const first = await updateOperationalConfig(
      { cashFundId: fund.id, riskThreshold: 5 },
      t1.ctx,
    );
    expect(first.riskThreshold).toBe(5);

    const second = await updateOperationalConfig(
      { cashFundId: fund.id, riskThreshold: 8 },
      t2.ctx,
    );
    expect(second.riskThreshold).toBe(8);

    const active = await prisma.cashFundUser.count({
      where: { cashFundId: fund.id, status: "ACTIVE" },
    });
    expect(active).toBe(2);
  });

  // AC-F03-003: once an assignment is revoked the fund is no longer available,
  // but the history row is preserved (BR-F03-004).
  it("AC-F03-003: a revoked assignment removes access and keeps the history row", async () => {
    const ctx = await adminContext();
    const fund = await activeFund(ctx);
    const t = await makeTreasurer(ctx, T1);

    await assignTreasurer({ cashFundId: fund.id, userId: t.id }, ctx);
    expect(await listAssignedCashFunds(t.ctx)).toContain(fund.id);

    await unassignTreasurer({ cashFundId: fund.id, userId: t.id }, ctx);

    expect(await listAssignedCashFunds(t.ctx)).not.toContain(fund.id);
    await expect(
      updateOperationalConfig({ cashFundId: fund.id, riskThreshold: 9 }, t.ctx),
    ).rejects.toMatchObject({ code: F02_ERROR_CODES.UNAUTHORIZED });

    const row = await prisma.cashFundUser.findUnique({
      where: { cashFundId_userId: { cashFundId: fund.id, userId: t.id } },
    });
    expect(row?.status).toBe("REVOKED");
  });

  // BR-F03-002 / idempotency: re-assigning is a no-op and re-assigning after a
  // revoke reactivates the SAME row — never a duplicate.
  it("assignment is idempotent and reactivates a revoked row (single history row)", async () => {
    const ctx = await adminContext();
    const fund = await activeFund(ctx);
    const t = await makeTreasurer(ctx, T1);

    await assignTreasurer({ cashFundId: fund.id, userId: t.id }, ctx);
    await assignTreasurer({ cashFundId: fund.id, userId: t.id }, ctx);
    await unassignTreasurer({ cashFundId: fund.id, userId: t.id }, ctx);
    await assignTreasurer({ cashFundId: fund.id, userId: t.id }, ctx);

    const rows = await prisma.cashFundUser.findMany({
      where: { cashFundId: fund.id, userId: t.id },
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]?.status).toBe("ACTIVE");
    expect(await listAssignedCashFunds(t.ctx)).toContain(fund.id);
  });

  // BR-F03-001: a treasurer cannot manage assignments.
  it("BR-F03-001: a treasurer cannot assign treasurers", async () => {
    const ctx = await adminContext();
    const fund = await activeFund(ctx);
    const t = await makeTreasurer(ctx, T1);

    await expect(
      assignTreasurer({ cashFundId: fund.id, userId: t.id }, t.ctx),
    ).rejects.toMatchObject({ code: "F03_UNAUTHORIZED" });
  });
});
