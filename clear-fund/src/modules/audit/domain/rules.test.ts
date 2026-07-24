import { Decimal } from "decimal.js";
import { describe, expect, it } from "vitest";

import {
  buildChangeSet,
  buildCreationChangeSet,
  isEventVisible,
  isSensitiveField,
  linkToOriginalEvent,
  normalizeChangeSet,
  REDACTED,
  resolveAuditScope,
  toAuditValue,
} from "./rules";

describe("isSensitiveField (BR-F23-004)", () => {
  it.each([
    "password",
    "newPassword",
    "passwordHash",
    "PASSWORD",
    "accessToken",
    "refresh_token",
    "clientSecret",
    "apiKey",
    "credentialId",
    "privateKey",
  ])("flags %s as sensitive", (field) => {
    expect(isSensitiveField(field)).toBe(true);
  });

  it.each(["email", "name", "status", "recommendedDay", "banReason", "role"])(
    "does not flag %s",
    (field) => {
      expect(isSensitiveField(field)).toBe(false);
    },
  );
});

describe("toAuditValue", () => {
  it("collapses undefined and null to null so absent and empty read alike", () => {
    expect(toAuditValue(undefined)).toBeNull();
    expect(toAuditValue(null)).toBeNull();
  });

  it("serializes a Date as an ISO string", () => {
    expect(toAuditValue(new Date("2026-03-01T12:00:00.000Z"))).toBe(
      "2026-03-01T12:00:00.000Z",
    );
  });

  it("serializes a Decimal as a decimal string, never a number", () => {
    const value = toAuditValue(new Decimal("25.50"));
    expect(value).toBe("25.5");
    expect(typeof value).toBe("string");
  });

  it("keeps primitives as-is", () => {
    expect(toAuditValue("ACTIVE")).toBe("ACTIVE");
    expect(toAuditValue(28)).toBe(28);
    expect(toAuditValue(false)).toBe(false);
  });

  it("encodes a nested object as JSON instead of [object Object]", () => {
    expect(toAuditValue({ a: 1 })).toBe('{"a":1}');
  });
});

describe("buildChangeSet (BR-F23-002)", () => {
  it("records only the fields that actually changed", () => {
    const changes = buildChangeSet(
      { recommendedDay: 5, maximumDay: 10, riskThreshold: 3 },
      { recommendedDay: 7, maximumDay: 10, riskThreshold: 3 },
    );

    expect(changes).toEqual({
      recommendedDay: { previous: 5, next: 7 },
    });
  });

  it("keeps previous and new values for the audit comparison (FR-F23-003)", () => {
    const changes = buildChangeSet({ status: "DRAFT" }, { status: "ACTIVE" });

    expect(changes.status).toEqual({ previous: "DRAFT", next: "ACTIVE" });
  });

  it("treats a Decimal change by value, not by object identity", () => {
    const unchanged = buildChangeSet(
      { monthlySavingAmount: new Decimal("25.00") },
      { monthlySavingAmount: new Decimal("25.0") },
    );
    expect(unchanged).toEqual({});

    const changed = buildChangeSet(
      { monthlySavingAmount: new Decimal("25.00") },
      { monthlySavingAmount: new Decimal("30.00") },
    );
    expect(changed.monthlySavingAmount).toEqual({
      previous: "25",
      next: "30",
    });
  });

  it("ignores fields absent from the new state", () => {
    const changes = buildChangeSet({ removed: "x" }, { kept: "y" });
    expect(Object.keys(changes)).toEqual(["kept"]);
  });

  it("redacts a sensitive value on both sides (BR-F23-004)", () => {
    const changes = buildChangeSet(
      { password: "old-secret" },
      { password: "new-secret" },
    );

    expect(changes.password).toEqual({ previous: REDACTED, next: REDACTED });
  });

  it("still reports a sensitive field as changed even though both sides redact equal", () => {
    // Without this rule the redacted values would compare equal and every
    // password change would silently vanish from the log.
    const changes = buildChangeSet(
      { password: "same" },
      { password: "same" },
    );

    expect(changes.password).toEqual({ previous: REDACTED, next: REDACTED });
  });
});

describe("buildCreationChangeSet", () => {
  it("records every provided field with no previous value", () => {
    const changes = buildCreationChangeSet({ name: "Caja 1", status: "DRAFT" });

    expect(changes).toEqual({
      name: { previous: null, next: "Caja 1" },
      status: { previous: null, next: "DRAFT" },
    });
  });

  it("redacts a secret supplied at creation (BR-F23-004)", () => {
    const changes = buildCreationChangeSet({
      email: "t@example.com",
      password: "initial-secret",
    });

    expect(changes.email!.next).toBe("t@example.com");
    expect(changes.password!.next).toBe(REDACTED);
    // The field name survives, so the log shows a password WAS set.
    expect(Object.keys(changes)).toContain("password");
  });
});

describe("normalizeChangeSet", () => {
  it("collapses an empty change set to null", () => {
    expect(normalizeChangeSet({})).toBeNull();
  });

  it("passes a non-empty change set through", () => {
    const changes = { status: { previous: "A", next: "B" } };
    expect(normalizeChangeSet(changes)).toBe(changes);
  });
});

describe("resolveAuditScope (FR-F23-001 / FR-F23-002)", () => {
  it("gives a Super Admin the whole log, global events included", () => {
    expect(
      resolveAuditScope({
        isSuperAdmin: true,
        requestedCashFundId: null,
        assignedCashFundIds: [],
      }),
    ).toEqual({ kind: "ALL" });
  });

  it("narrows a Super Admin to one fund when they ask for it", () => {
    expect(
      resolveAuditScope({
        isSuperAdmin: true,
        requestedCashFundId: "fund-1",
        assignedCashFundIds: [],
      }),
    ).toEqual({ kind: "FUNDS", cashFundIds: ["fund-1"] });
  });

  it("limits a treasurer to their assigned funds (AC-F23-003)", () => {
    expect(
      resolveAuditScope({
        isSuperAdmin: false,
        requestedCashFundId: null,
        assignedCashFundIds: ["fund-1", "fund-2"],
      }),
    ).toEqual({ kind: "FUNDS", cashFundIds: ["fund-1", "fund-2"] });
  });

  it("allows a treasurer to ask for a fund they are assigned to", () => {
    expect(
      resolveAuditScope({
        isSuperAdmin: false,
        requestedCashFundId: "fund-2",
        assignedCashFundIds: ["fund-1", "fund-2"],
      }),
    ).toEqual({ kind: "FUNDS", cashFundIds: ["fund-2"] });
  });

  it("forbids a treasurer asking for a fund they are not assigned to", () => {
    expect(
      resolveAuditScope({
        isSuperAdmin: false,
        requestedCashFundId: "fund-9",
        assignedCashFundIds: ["fund-1"],
      }),
    ).toEqual({ kind: "FORBIDDEN" });
  });

  it("gives a treasurer with no assignments an empty scope, not global access", () => {
    expect(
      resolveAuditScope({
        isSuperAdmin: false,
        requestedCashFundId: null,
        assignedCashFundIds: [],
      }),
    ).toEqual({ kind: "FUNDS", cashFundIds: [] });
  });
});

describe("isEventVisible", () => {
  it("shows everything under an ALL scope", () => {
    expect(isEventVisible({ kind: "ALL" }, { cashFundId: null })).toBe(true);
    expect(isEventVisible({ kind: "ALL" }, { cashFundId: "fund-1" })).toBe(true);
  });

  it("hides a global event from a fund-scoped caller (spec edge case)", () => {
    // A treasurer must never read USER_CREATED / USER_DISABLED (ADR-013).
    expect(
      isEventVisible({ kind: "FUNDS", cashFundIds: ["fund-1"] }, {
        cashFundId: null,
      }),
    ).toBe(false);
  });

  it("hides another fund's event from a fund-scoped caller", () => {
    expect(
      isEventVisible({ kind: "FUNDS", cashFundIds: ["fund-1"] }, {
        cashFundId: "fund-2",
      }),
    ).toBe(false);
  });

  it("shows an in-scope fund event", () => {
    expect(
      isEventVisible({ kind: "FUNDS", cashFundIds: ["fund-1"] }, {
        cashFundId: "fund-1",
      }),
    ).toBe(true);
  });

  it("hides everything under a FORBIDDEN scope", () => {
    expect(isEventVisible({ kind: "FORBIDDEN" }, { cashFundId: "fund-1" })).toBe(
      false,
    );
  });
});

describe("linkToOriginalEvent (BR-F23-005)", () => {
  it("points at the original and opens a group with its id", () => {
    expect(linkToOriginalEvent({ id: "event-1", correlationId: null })).toEqual({
      relatedEventId: "event-1",
      correlationId: "event-1",
    });
  });

  it("inherits an existing correlation so a whole chain stays queryable", () => {
    expect(
      linkToOriginalEvent({ id: "event-2", correlationId: "event-1" }),
    ).toEqual({
      relatedEventId: "event-2",
      correlationId: "event-1",
    });
  });
});
