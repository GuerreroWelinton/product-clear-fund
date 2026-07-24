import { describe, expect, it } from "vitest";

import {
  AUDIT_PAGE_SIZE_DEFAULT,
  AUDIT_PAGE_SIZE_MAX,
  getAuditEventSchema,
  listAuditEventsSchema,
} from ".";

describe("listAuditEventsSchema", () => {
  it("defaults to the first page with the default page size", () => {
    const parsed = listAuditEventsSchema.parse({});
    expect(parsed.page).toBe(1);
    expect(parsed.pageSize).toBe(AUDIT_PAGE_SIZE_DEFAULT);
    expect(parsed.cashFundId).toBeUndefined();
  });

  it("coerces numeric strings, so query params parse directly", () => {
    const parsed = listAuditEventsSchema.parse({ page: "3", pageSize: "10" });
    expect(parsed.page).toBe(3);
    expect(parsed.pageSize).toBe(10);
  });

  it("caps the page size so no caller can request the whole log", () => {
    expect(() =>
      listAuditEventsSchema.parse({ pageSize: AUDIT_PAGE_SIZE_MAX + 1 }),
    ).toThrow();
  });

  it("rejects a non-positive page", () => {
    expect(() => listAuditEventsSchema.parse({ page: 0 })).toThrow();
  });

  it("rejects an empty cashFundId rather than treating it as absent", () => {
    expect(() => listAuditEventsSchema.parse({ cashFundId: "" })).toThrow();
  });

  it("accepts the optional filters", () => {
    const parsed = listAuditEventsSchema.parse({
      cashFundId: "fund-1",
      action: "CASH_FUND_ACTIVATED",
      entityType: "CASH_FUND",
      entityId: "fund-1",
      actorId: "user-1",
    });
    expect(parsed.action).toBe("CASH_FUND_ACTIVATED");
    expect(parsed.actorId).toBe("user-1");
  });
});

describe("getAuditEventSchema", () => {
  it("requires a non-empty id", () => {
    expect(getAuditEventSchema.parse({ id: "event-1" }).id).toBe("event-1");
    expect(() => getAuditEventSchema.parse({ id: "" })).toThrow();
  });
});
