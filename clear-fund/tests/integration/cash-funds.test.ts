import { Decimal } from "decimal.js";
import { beforeEach, describe, expect, it } from "vitest";

import { createTreasurer } from "@/modules/auth/application";
import {
  activateCashFund,
  createCashFund,
  deactivateCashFund,
  updateCashFundDraft,
  updateOperationalConfig,
} from "@/modules/cash-funds/application";
import { F02_ERROR_CODES } from "@/modules/cash-funds/domain/errors";

import { prisma, resetDb, seedSuperAdmin, signIn } from "./helpers";

const ADMIN = { email: "admin@test.local", password: "admin-password-123" };
const TREASURER = {
  email: "tesorero@test.local",
  name: "Tesorero Uno",
  password: "treasurer-password-123",
};

const BASE_FUND = {
  name: "Caja Central",
  monthlySavingAmount: "50.00",
  recommendedDay: 5,
  maximumDay: 15,
  maxAdvanceMonths: 3,
  riskThreshold: 3,
};

// Signs in the seeded Super Admin and returns an authenticated RequestContext.
async function adminContext() {
  await seedSuperAdmin(ADMIN);
  const auth = await signIn(ADMIN);
  return { headers: auth.authHeaders };
}

// Creates a treasurer (via F01) and gives them an ACTIVE assignment to a fund.
async function assignTreasurer(cashFundId: string, adminCtx: { headers: Headers }) {
  const treasurer = await createTreasurer(TREASURER, adminCtx);
  await prisma.cashFundUser.create({
    data: { cashFundId, userId: treasurer.id, status: "ACTIVE" },
  });
  return treasurer;
}

beforeEach(async () => {
  await resetDb();
});

describe("F02 cash fund lifecycle (integration)", () => {
  // AC-F02-001: a fund with numbers rejects changing the fixed fee. The
  // "with numbers" dimension is the F05 seam (hasFirstNumber); in F02
  // activation alone locks the fee (BR-F02-002, ADR-010).
  it("AC-F02-001: cannot change the fixed fee once the fund is ACTIVE", async () => {
    const ctx = await adminContext();
    const fund = await createCashFund(BASE_FUND, ctx);
    await activateCashFund({ cashFundId: fund.id }, ctx);

    await expect(
      updateCashFundDraft(
        { cashFundId: fund.id, monthlySavingAmount: "99.00" },
        ctx,
      ),
    ).rejects.toMatchObject({
      code: F02_ERROR_CODES.CASH_FUND_FIXED_FEE_LOCKED,
    });

    const row = await prisma.cashFund.findUnique({ where: { id: fund.id } });
    expect(new Decimal(row!.monthlySavingAmount.toString()).eq("50")).toBe(true);
    expect(row?.status).toBe("ACTIVE");
  });

  // AC-F02-002: an inactive fund rejects operations — even from an assigned
  // treasurer (BR-F02-006).
  it("AC-F02-002: an inactive fund rejects operational-config changes", async () => {
    const ctx = await adminContext();
    const fund = await createCashFund(BASE_FUND, ctx);
    await activateCashFund({ cashFundId: fund.id }, ctx);
    await assignTreasurer(fund.id, ctx);
    await deactivateCashFund({ cashFundId: fund.id }, ctx);

    const treasurerAuth = await signIn(TREASURER);
    const treasurerCtx = { headers: treasurerAuth.authHeaders };

    await expect(
      updateOperationalConfig({ cashFundId: fund.id, riskThreshold: 9 }, treasurerCtx),
    ).rejects.toMatchObject({ code: F02_ERROR_CODES.CASH_FUND_INACTIVE });

    const row = await prisma.cashFund.findUnique({ where: { id: fund.id } });
    expect(row?.riskThreshold).toBe(3);
    expect(row?.status).toBe("INACTIVE");
  });

  // AC-F02-003 is DEFERRED to F06 (SavingsObligation) — see ADR-010. The
  // reactivation state transition is covered below; obligation backfill is out
  // of F02 scope.
  it.todo(
    "AC-F02-003: reactivation generates missing savings obligations (deferred to F06)",
  );

  // BR-F02-007: reactivating an inactive fund returns it to ACTIVE and
  // preserves deactivatedAt as the F06 backfill anchor.
  it("BR-F02-007: reactivation returns an inactive fund to ACTIVE, keeping the deactivation anchor", async () => {
    const ctx = await adminContext();
    const fund = await createCashFund(BASE_FUND, ctx);
    await activateCashFund({ cashFundId: fund.id }, ctx);
    await deactivateCashFund({ cashFundId: fund.id }, ctx);

    const reactivated = await activateCashFund({ cashFundId: fund.id }, ctx);
    expect(reactivated.status).toBe("ACTIVE");

    const row = await prisma.cashFund.findUnique({ where: { id: fund.id } });
    expect(row?.deactivatedAt).not.toBeNull();
  });

  // FR-F02-002: an assigned treasurer may edit operational config on an ACTIVE
  // fund.
  it("FR-F02-002: an assigned treasurer can edit operational config on an ACTIVE fund", async () => {
    const ctx = await adminContext();
    const fund = await createCashFund(BASE_FUND, ctx);
    await activateCashFund({ cashFundId: fund.id }, ctx);
    await assignTreasurer(fund.id, ctx);

    const treasurerAuth = await signIn(TREASURER);
    const updated = await updateOperationalConfig(
      { cashFundId: fund.id, riskThreshold: 7 },
      { headers: treasurerAuth.authHeaders },
    );

    expect(updated.riskThreshold).toBe(7);
  });

  // Isolation: a treasurer assigned to fund A cannot touch fund B
  // (no cross-fund access — F02 non-functional requirement).
  it("isolation: a treasurer assigned to fund A cannot edit fund B", async () => {
    const ctx = await adminContext();
    const fundA = await createCashFund({ ...BASE_FUND, name: "Caja A" }, ctx);
    const fundB = await createCashFund({ ...BASE_FUND, name: "Caja B" }, ctx);
    await activateCashFund({ cashFundId: fundB.id }, ctx);
    await assignTreasurer(fundA.id, ctx);

    const treasurerAuth = await signIn(TREASURER);

    await expect(
      updateOperationalConfig(
        { cashFundId: fundB.id, riskThreshold: 9 },
        { headers: treasurerAuth.authHeaders },
      ),
    ).rejects.toMatchObject({ code: F02_ERROR_CODES.UNAUTHORIZED });
  });
});
