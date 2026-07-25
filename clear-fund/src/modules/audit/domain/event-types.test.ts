import { describe, expect, it } from "vitest";

import { formatAuditValue } from "@/modules/audit/domain/event-types";
import { REDACTED } from "@/modules/audit/domain/rules";

describe("formatAuditValue", () => {
  it("renders null as an em dash", () => {
    expect(formatAuditValue("phrase", null)).toBe("—");
  });

  it("renders booleans in Spanish", () => {
    expect(formatAuditValue("banned", true)).toBe("Sí");
    expect(formatAuditValue("banned", false)).toBe("No");
  });

  it("passes non-date strings through untouched", () => {
    expect(formatAuditValue("name", "Caja Los Andes")).toBe("Caja Los Andes");
    expect(formatAuditValue("status", "DRAFT")).toBe("DRAFT");
  });

  it("passes decimal strings through untouched, never reformatting money", () => {
    expect(formatAuditValue("monthlySavingAmount", "50.00")).toBe("50.00");
  });

  it("passes numbers through untouched", () => {
    expect(formatAuditValue("recommendedDay", 5)).toBe("5");
  });

  it("does not treat the redaction marker as a date", () => {
    expect(formatAuditValue("passwordHash", REDACTED)).toBe(REDACTED);
  });

  // Stored at UTC midnight, so rendering in the business zone (UTC-5) would
  // print the previous day.
  describe("date-only fields", () => {
    it("keeps the calendar date stored at UTC midnight", () => {
      const formatted = formatAuditValue(
        "officialStartDate",
        "2026-03-15T00:00:00.000Z",
      );
      expect(formatted).toContain("15");
      expect(formatted).not.toContain("14");
    });

    it("does not shift the day across a month boundary", () => {
      const formatted = formatAuditValue(
        "officialStartDate",
        "2026-03-01T00:00:00.000Z",
      );
      expect(formatted).toContain("1");
      expect(formatted).not.toMatch(/febrero|feb/i);
    });

    it("does not shift the day across a year boundary", () => {
      const formatted = formatAuditValue(
        "officialStartDate",
        "2026-01-01T00:00:00.000Z",
      );
      expect(formatted).toContain("2026");
      expect(formatted).not.toContain("2025");
    });

    it("renders no time component", () => {
      const formatted = formatAuditValue(
        "officialStartDate",
        "2026-03-15T00:00:00.000Z",
      );
      expect(formatted).not.toMatch(/\d{1,2}:\d{2}/);
    });
  });

  describe("timestamp fields", () => {
    it("shifts an instant into the business zone", () => {
      // 02:30 UTC is 21:30 the previous day in America/Guayaquil, rendered on a
      // 12-hour clock by es-EC.
      const formatted = formatAuditValue(
        "activatedAt",
        "2026-03-15T02:30:00.000Z",
      );
      expect(formatted).toContain("14");
      expect(formatted).toMatch(/9:30/);
      expect(formatted).toMatch(/p\.\s?m\./i);
    });

    it("renders a time component", () => {
      const formatted = formatAuditValue(
        "deactivatedAt",
        "2026-03-15T15:45:10.000Z",
      );
      expect(formatted).toMatch(/\d{1,2}:\d{2}/);
    });

    it("accepts an ISO instant without milliseconds", () => {
      const formatted = formatAuditValue("activatedAt", "2026-03-15T15:45:10Z");
      expect(formatted).toMatch(/\d{1,2}:\d{2}/);
    });
  });

  it("leaves a bare YYYY-MM-DD string alone rather than guessing a zone", () => {
    expect(formatAuditValue("officialStartDate", "2026-03-15")).toBe(
      "2026-03-15",
    );
  });
});
