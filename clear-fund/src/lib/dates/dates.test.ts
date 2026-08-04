import { describe, expect, it } from "vitest";

import {
  BUSINESS_TIME_ZONE,
  businessDayEndExclusive,
  businessDayStart,
} from "@/lib/dates";

// Guayaquil is UTC-5 year round, so every boundary below lands on 05:00Z.
// The expectations are absolute on purpose: an implementation that fell back
// to the process timezone would pass on a -5 machine and fail in CI (UTC).
describe("business calendar days", () => {
  it("takes the business timezone from TECHNICAL_CONVENTIONS.md", () => {
    expect(BUSINESS_TIME_ZONE).toBe("America/Guayaquil");
  });

  it("starts a day at midnight in the business timezone", () => {
    expect(businessDayStart("2026-06-30").toISOString()).toBe(
      "2026-06-30T05:00:00.000Z",
    );
  });

  it("ends a day at the next midnight in the business timezone", () => {
    expect(businessDayEndExclusive("2026-06-30").toISOString()).toBe(
      "2026-07-01T05:00:00.000Z",
    );
  });

  it("rolls over month and year boundaries", () => {
    expect(businessDayEndExclusive("2026-02-28").toISOString()).toBe(
      "2026-03-01T05:00:00.000Z",
    );
    expect(businessDayEndExclusive("2026-12-31").toISOString()).toBe(
      "2027-01-01T05:00:00.000Z",
    );
  });

  // The row that raised the question during F20 manual validation: 20:00 on
  // June 30 in Guayaquil, stored as July 1 in UTC. It belongs to the day the
  // ledger displays it under.
  it("keeps a late-evening instant inside the day the ledger displays", () => {
    const lateOnJune30 = new Date("2026-07-01T01:00:00.000Z");

    expect(lateOnJune30 >= businessDayStart("2026-06-30")).toBe(true);
    expect(lateOnJune30 < businessDayEndExclusive("2026-06-30")).toBe(true);
  });
});
