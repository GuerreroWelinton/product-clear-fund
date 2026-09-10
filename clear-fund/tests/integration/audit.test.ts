import { beforeEach, describe, expect, it } from "vitest";

import { getAuditEvent, listAuditEvents } from "@/modules/audit/application";
import { F23_ERROR_CODES } from "@/modules/audit/domain/errors";
import { createTreasurer, disableUser } from "@/modules/auth/application";
import {
  activateCashFund,
  createCashFund,
  deactivateCashFund,
  updateOperationalConfig,
} from "@/modules/cash-funds/application";
import { F02_ERROR_CODES } from "@/modules/cash-funds/domain/errors";
import {
  assignTreasurer,
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

async function makeTreasurer(
  adminCtx: { headers: Headers },
  creds: { email: string; name: string; password: string },
) {
  const treasurer = await createTreasurer(creds, adminCtx);
  const auth = await signIn(creds);
  return { id: treasurer.id, ctx: { headers: auth.authHeaders } };
}

async function activeFund(ctx: { headers: Headers }, name = BASE_FUND.name) {
  const fund = await createCashFund({ ...BASE_FUND, name }, ctx);
  await activateCashFund({ cashFundId: fund.id }, ctx);
  return fund;
}

beforeEach(async () => {
  await resetDb();
});

describe("F23 audit log (integration)", () => {
  // AC-F23-001 (adapted per ADR-013 section 8): the scenario is written against a
  // cédula change, but Person belongs to F04. The MECHANISM it asks for —
  // previous value, new value, reason and actor — is verified here on operations
  // that exist today: USER_DISABLED (which carries a real reason) and
  // CASH_FUND_CONFIG_CHANGED (a real before/after diff).
  it("AC-F23-001: a change keeps previous value, new value, reason and actor", async () => {
    const ctx = await adminContext();
    const t = await makeTreasurer(ctx, T1);

    await disableUser(
      { userId: t.id, banReason: "salió de la caja" },
      ctx,
    );

    const page = await listAuditEvents({ action: "USER_DISABLED" }, ctx);
    expect(page.total).toBe(1);

    const event = page.events[0]!;
    expect(event.reason).toBe("salió de la caja");
    expect(event.actorEmail).toBe(ADMIN.email);
    expect(event.actorRole).toBe("SUPER_ADMIN");
    expect(event.entityType).toBe("USER");
    expect(event.entityId).toBe(t.id);
    // An account is global: it belongs to no fund (spec edge case).
    expect(event.cashFundId).toBeNull();
    expect(event.changes).toMatchObject({
      banned: { previous: false, next: true },
      banReason: { previous: null, next: "salió de la caja" },
    });
  });

  it("AC-F23-001: a config change records the exact before/after values", async () => {
    const ctx = await adminContext();
    const fund = await activeFund(ctx);

    await updateOperationalConfig(
      { cashFundId: fund.id, riskThreshold: 9 },
      ctx,
    );

    const page = await listAuditEvents(
      { cashFundId: fund.id, action: "CASH_FUND_CONFIG_CHANGED" },
      ctx,
    );
    expect(page.total).toBe(1);
    expect(page.events[0]!.changes).toEqual({
      riskThreshold: { previous: 3, next: 9 },
    });
    expect(page.events[0]!.actorEmail).toBe(ADMIN.email);
  });

  // AC-F23-003: a treasurer only ever reads events of their own funds.
  it("AC-F23-003: a treasurer only sees audit events of their assigned funds", async () => {
    const ctx = await adminContext();
    const mine = await activeFund(ctx, "Caja Mía");
    const other = await activeFund(ctx, "Caja Ajena");
    const t = await makeTreasurer(ctx, T1);

    await assignTreasurer({ cashFundId: mine.id, userId: t.id }, ctx);

    // Produce events on both funds.
    await updateOperationalConfig({ cashFundId: mine.id, riskThreshold: 7 }, ctx);
    await updateOperationalConfig({ cashFundId: other.id, riskThreshold: 8 }, ctx);

    const page = await listAuditEvents({}, t.ctx);

    expect(page.total).toBeGreaterThan(0);
    const fundIds = new Set(page.events.map((event) => event.cashFundId));
    expect(fundIds).toEqual(new Set([mine.id]));
    // Global events (USER_CREATED for this very treasurer) must not leak.
    expect(page.events.every((event) => event.cashFundId !== null)).toBe(true);
  });

  it("AC-F23-003: a treasurer asking for another fund is rejected", async () => {
    const ctx = await adminContext();
    const mine = await activeFund(ctx, "Caja Mía");
    const other = await activeFund(ctx, "Caja Ajena");
    const t = await makeTreasurer(ctx, T1);
    await assignTreasurer({ cashFundId: mine.id, userId: t.id }, ctx);

    await expect(
      listAuditEvents({ cashFundId: other.id }, t.ctx),
    ).rejects.toMatchObject({ code: F23_ERROR_CODES.FORBIDDEN_CASH_FUND });
  });

  it("AC-F23-003: a treasurer cannot read another fund's event by id", async () => {
    const ctx = await adminContext();
    const mine = await activeFund(ctx, "Caja Mía");
    const other = await activeFund(ctx, "Caja Ajena");
    const t = await makeTreasurer(ctx, T1);
    await assignTreasurer({ cashFundId: mine.id, userId: t.id }, ctx);

    await updateOperationalConfig({ cashFundId: other.id, riskThreshold: 8 }, ctx);
    const otherPage = await listAuditEvents({ cashFundId: other.id }, ctx);
    const otherEventId = otherPage.events[0]!.id;

    // EVENT_NOT_FOUND rather than FORBIDDEN: telling them apart would confirm the
    // event exists in a fund they cannot access.
    await expect(
      getAuditEvent({ id: otherEventId }, t.ctx),
    ).rejects.toMatchObject({ code: F23_ERROR_CODES.EVENT_NOT_FOUND });

    // The same id IS readable by the Super Admin.
    const event = await getAuditEvent({ id: otherEventId }, ctx);
    expect(event.cashFundId).toBe(other.id);
  });

  it("a treasurer with no assignments reads an empty log, not a global one", async () => {
    const ctx = await adminContext();
    await activeFund(ctx);
    const t = await makeTreasurer(ctx, T1);

    const page = await listAuditEvents({}, t.ctx);
    expect(page.total).toBe(0);
    expect(page.events).toEqual([]);
  });

  // BR-F23-003: immutability is enforced by the database, not only by the absence
  // of update/delete use cases.
  it("BR-F23-003: the audit trail cannot be updated or deleted", async () => {
    const ctx = await adminContext();
    const fund = await activeFund(ctx);
    const page = await listAuditEvents({ cashFundId: fund.id }, ctx);
    const eventId = page.events[0]!.id;

    await expect(
      prisma.$executeRawUnsafe(
        `UPDATE "audit_event" SET action = 'TAMPERED' WHERE id = $1`,
        eventId,
      ),
    ).rejects.toThrow();

    await expect(
      prisma.$executeRawUnsafe(
        `DELETE FROM "audit_event" WHERE id = $1`,
        eventId,
      ),
    ).rejects.toThrow();

    const stillThere = await prisma.auditEvent.findUnique({
      where: { id: eventId },
    });
    expect(stillThere).not.toBeNull();
    expect(stillThere?.action).not.toBe("TAMPERED");
  });

  // BR-F23-004: no secret ever reaches the log.
  it("BR-F23-004: an initial password is redacted, never stored", async () => {
    const ctx = await adminContext();
    await makeTreasurer(ctx, T1);

    const page = await listAuditEvents({ action: "USER_CREATED" }, ctx);
    const event = page.events[0]!;

    expect(event.changes?.password).toEqual({
      previous: null,
      next: "[REDACTED]",
    });

    // Belt and braces: the raw persisted row must not contain the secret either.
    const raw = await prisma.auditEvent.findUnique({ where: { id: event.id } });
    expect(JSON.stringify(raw)).not.toContain(T1.password);
  });

  // BR-F23-001: the retroactive wiring covers F01, F02 and F03 (ADR-013).
  it("BR-F23-001: F01, F02 and F03 sensitive writes all produce events", async () => {
    const ctx = await adminContext();
    const fund = await createCashFund(BASE_FUND, ctx);
    await activateCashFund({ cashFundId: fund.id }, ctx);
    await updateOperationalConfig({ cashFundId: fund.id, riskThreshold: 6 }, ctx);
    await deactivateCashFund({ cashFundId: fund.id }, ctx);
    const t = await makeTreasurer(ctx, T2);
    await assignTreasurer({ cashFundId: fund.id, userId: t.id }, ctx);
    await unassignTreasurer({ cashFundId: fund.id, userId: t.id }, ctx);

    const page = await listAuditEvents({ pageSize: 100 }, ctx);
    const actions = page.events.map((event) => event.action);

    expect(new Set(actions)).toEqual(
      new Set([
        "USER_CREATED",
        "CASH_FUND_CREATED",
        "CASH_FUND_ACTIVATED",
        "CASH_FUND_CONFIG_CHANGED",
        "CASH_FUND_DEACTIVATED",
        "TREASURER_ASSIGNED",
        "TREASURER_UNASSIGNED",
      ]),
    );
  });

  // ADR-013: an idempotent no-op changed nothing, so it must not be audited.
  it("an idempotent re-assignment records no second event", async () => {
    const ctx = await adminContext();
    const fund = await activeFund(ctx);
    const t = await makeTreasurer(ctx, T1);

    await assignTreasurer({ cashFundId: fund.id, userId: t.id }, ctx);
    await assignTreasurer({ cashFundId: fund.id, userId: t.id }, ctx);

    const page = await listAuditEvents(
      { cashFundId: fund.id, action: "TREASURER_ASSIGNED" },
      ctx,
    );
    expect(page.total).toBe(1);
  });

  // Spec edge case "operación fallida no confirmada": a rejected operation must
  // leave no event behind. F02/F03 get this from the shared transaction.
  it("a failed operation leaves no audit event", async () => {
    const ctx = await adminContext();
    const fund = await activeFund(ctx);
    await deactivateCashFund({ cashFundId: fund.id }, ctx);

    const before = await prisma.auditEvent.count();

    // Editing operational config is invalid while the fund is INACTIVE.
    await expect(
      updateOperationalConfig({ cashFundId: fund.id, riskThreshold: 9 }, ctx),
    ).rejects.toMatchObject({ code: F02_ERROR_CODES.CASH_FUND_INACTIVE });

    expect(await prisma.auditEvent.count()).toBe(before);
  });

  it("orders the log newest first and paginates deterministically", async () => {
    const ctx = await adminContext();
    const fund = await activeFund(ctx);
    for (const threshold of [4, 5, 6]) {
      await updateOperationalConfig(
        { cashFundId: fund.id, riskThreshold: threshold },
        ctx,
      );
    }

    const first = await listAuditEvents(
      { cashFundId: fund.id, pageSize: 2, page: 1 },
      ctx,
    );
    const second = await listAuditEvents(
      { cashFundId: fund.id, pageSize: 2, page: 2 },
      ctx,
    );

    expect(first.events).toHaveLength(2);
    expect(first.total).toBe(5); // created + activated + 3 config changes
    // Newest first.
    expect(
      new Date(first.events[0]!.occurredAt).getTime(),
    ).toBeGreaterThanOrEqual(new Date(first.events[1]!.occurredAt).getTime());
    // No overlap between pages.
    const firstIds = new Set(first.events.map((event) => event.id));
    expect(second.events.some((event) => firstIds.has(event.id))).toBe(false);
  });

  it("rejects an unauthenticated caller with F23_UNAUTHORIZED", async () => {
    const ctx = await adminContext();
    await activeFund(ctx);

    await expect(
      listAuditEvents({}, { headers: new Headers() }),
    ).rejects.toMatchObject({ code: F23_ERROR_CODES.UNAUTHORIZED });
  });
});
