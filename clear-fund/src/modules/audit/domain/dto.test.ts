import { describe, expect, it } from "vitest";

import { parseChangeSet, toAuditEventDto } from "./dto";
import { auditActionLabel, auditEntityLabel, isKnownAuditAction } from "./event-types";

describe("parseChangeSet", () => {
  it("parses a well-formed persisted diff", () => {
    expect(
      parseChangeSet({ status: { previous: "DRAFT", next: "ACTIVE" } }),
    ).toEqual({ status: { previous: "DRAFT", next: "ACTIVE" } });
  });

  it("returns null for SQL NULL", () => {
    expect(parseChangeSet(null)).toBeNull();
  });

  it("returns null for a non-object payload", () => {
    expect(parseChangeSet("nope")).toBeNull();
    expect(parseChangeSet(42)).toBeNull();
    expect(parseChangeSet([1, 2])).toBeNull();
  });

  it("drops entries that are not a previous/next pair instead of trusting them", () => {
    // A row written by a future feature (or by hand) could hold any JSON; the
    // detail view must never render arbitrary shapes as a field diff.
    expect(
      parseChangeSet({
        good: { previous: 1, next: 2 },
        badShape: { foo: "bar" },
        badNested: { previous: { a: 1 }, next: 2 },
        notAnObject: "x",
      }),
    ).toEqual({ good: { previous: 1, next: 2 } });
  });

  it("returns null when nothing survives validation", () => {
    expect(parseChangeSet({ badShape: { foo: "bar" } })).toBeNull();
  });
});

describe("toAuditEventDto", () => {
  it("normalizes the row into the module's stable output shape", () => {
    const dto = toAuditEventDto({
      id: "event-1",
      actorId: "user-1",
      actorEmail: "admin@example.com",
      actorRole: "SUPER_ADMIN",
      occurredAt: new Date("2026-03-01T12:00:00.000Z"),
      cashFundId: "fund-1",
      entityType: "CASH_FUND",
      entityId: "fund-1",
      action: "CASH_FUND_ACTIVATED",
      reason: null,
      changes: { status: { previous: "DRAFT", next: "ACTIVE" } },
      relatedEventId: null,
      correlationId: null,
    });

    expect(dto.occurredAt).toBe("2026-03-01T12:00:00.000Z");
    expect(dto.changes).toEqual({
      status: { previous: "DRAFT", next: "ACTIVE" },
    });
  });

  it("keeps cashFundId null for a global event (spec edge case)", () => {
    const dto = toAuditEventDto({
      id: "event-2",
      actorId: "user-1",
      actorEmail: "admin@example.com",
      actorRole: "SUPER_ADMIN",
      occurredAt: "2026-03-01T12:00:00.000Z",
      cashFundId: null,
      entityType: "USER",
      entityId: "user-9",
      action: "USER_CREATED",
      reason: null,
      changes: null,
      relatedEventId: null,
      correlationId: null,
    });

    expect(dto.cashFundId).toBeNull();
    expect(dto.changes).toBeNull();
  });
});

describe("audit labels", () => {
  it("labels a known action in Spanish", () => {
    expect(auditActionLabel("CASH_FUND_ACTIVATED")).toBe("Caja activada");
    expect(isKnownAuditAction("CASH_FUND_ACTIVATED")).toBe(true);
  });

  it("falls back to the raw value for an action a future feature adds", () => {
    // The column is TEXT (ADR-013), so an unknown action must not crash the UI.
    expect(isKnownAuditAction("PAYMENT_CONFIRMED")).toBe(false);
    expect(auditActionLabel("PAYMENT_CONFIRMED")).toBe("PAYMENT_CONFIRMED");
  });

  it("labels known entity types and falls back otherwise", () => {
    expect(auditEntityLabel("USER")).toBe("Usuario");
    expect(auditEntityLabel("MEMBERSHIP")).toBe("MEMBERSHIP");
  });
});
