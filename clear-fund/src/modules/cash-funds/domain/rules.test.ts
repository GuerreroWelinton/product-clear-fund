import { describe, expect, it } from "vitest";

import { F02_ERROR_CODES } from "./errors";
import {
  canEditFixedFee,
  canEditOperationalConfig,
  canTransition,
  hasFirstNumber,
  validateDayConfig,
  validatePositiveAmount,
} from "./rules";

describe("canTransition", () => {
  it("allows DRAFT -> ACTIVE", () => {
    expect(canTransition("DRAFT", "ACTIVE")).toBe(true);
  });

  it("allows ACTIVE -> INACTIVE", () => {
    expect(canTransition("ACTIVE", "INACTIVE")).toBe(true);
  });

  it("allows INACTIVE -> ACTIVE", () => {
    expect(canTransition("INACTIVE", "ACTIVE")).toBe(true);
  });

  it("rejects DRAFT -> INACTIVE", () => {
    expect(canTransition("DRAFT", "INACTIVE")).toBe(false);
  });

  it("rejects ACTIVE -> DRAFT", () => {
    expect(canTransition("ACTIVE", "DRAFT")).toBe(false);
  });

  it("rejects INACTIVE -> DRAFT", () => {
    expect(canTransition("INACTIVE", "DRAFT")).toBe(false);
  });

  it("rejects a no-op transition to the same state", () => {
    expect(canTransition("DRAFT", "DRAFT")).toBe(false);
    expect(canTransition("ACTIVE", "ACTIVE")).toBe(false);
    expect(canTransition("INACTIVE", "INACTIVE")).toBe(false);
  });
});

describe("hasFirstNumber", () => {
  // F05 SEAM: numbering does not exist yet in F02, so this always returns
  // false regardless of nextMemberNumber.
  it("always returns false in F02, even if nextMemberNumber were > 1", () => {
    expect(hasFirstNumber({ nextMemberNumber: 1 })).toBe(false);
    expect(hasFirstNumber({ nextMemberNumber: 5 })).toBe(false);
  });
});

describe("canEditFixedFee", () => {
  it("is true when the fund is DRAFT and no first number has been issued", () => {
    expect(
      canEditFixedFee({ status: "DRAFT", nextMemberNumber: 1 }),
    ).toBe(true);
  });

  it("is false when the fund is ACTIVE", () => {
    expect(
      canEditFixedFee({ status: "ACTIVE", nextMemberNumber: 1 }),
    ).toBe(false);
  });

  it("is false when the fund is INACTIVE", () => {
    expect(
      canEditFixedFee({ status: "INACTIVE", nextMemberNumber: 1 }),
    ).toBe(false);
  });
});

describe("canEditOperationalConfig", () => {
  it("is true only when the fund is ACTIVE", () => {
    expect(canEditOperationalConfig({ status: "ACTIVE" })).toBe(true);
  });

  it("is false when the fund is DRAFT", () => {
    expect(canEditOperationalConfig({ status: "DRAFT" })).toBe(false);
  });

  it("is false when the fund is INACTIVE", () => {
    expect(canEditOperationalConfig({ status: "INACTIVE" })).toBe(false);
  });
});

describe("validateDayConfig", () => {
  it("accepts recommendedDay === maximumDay at the lower bound", () => {
    expect(() => validateDayConfig(1, 1)).not.toThrow();
  });

  it("accepts recommendedDay < maximumDay within bounds", () => {
    expect(() => validateDayConfig(5, 28)).not.toThrow();
  });

  it("accepts maximumDay === 28 at the upper bound", () => {
    expect(() => validateDayConfig(28, 28)).not.toThrow();
  });

  it("rejects recommendedDay > maximumDay", () => {
    expect(() => validateDayConfig(10, 5)).toThrow(
      expect.objectContaining({ code: F02_ERROR_CODES.INVALID_DAY_CONFIG }),
    );
  });

  it("rejects recommendedDay < 1", () => {
    expect(() => validateDayConfig(0, 10)).toThrow(
      expect.objectContaining({ code: F02_ERROR_CODES.INVALID_DAY_CONFIG }),
    );
  });

  it("rejects maximumDay > 28", () => {
    expect(() => validateDayConfig(1, 29)).toThrow(
      expect.objectContaining({ code: F02_ERROR_CODES.INVALID_DAY_CONFIG }),
    );
  });

  it("rejects non-integer days", () => {
    expect(() => validateDayConfig(1.5, 10)).toThrow(
      expect.objectContaining({ code: F02_ERROR_CODES.INVALID_DAY_CONFIG }),
    );
  });
});

describe("validatePositiveAmount", () => {
  it("accepts a positive amount", () => {
    expect(() => validatePositiveAmount("100.00")).not.toThrow();
  });

  it("rejects zero", () => {
    expect(() => validatePositiveAmount("0")).toThrow(
      expect.objectContaining({ code: F02_ERROR_CODES.INVALID_INPUT }),
    );
  });

  it("rejects a negative amount", () => {
    expect(() => validatePositiveAmount("-5.00")).toThrow(
      expect.objectContaining({ code: F02_ERROR_CODES.INVALID_INPUT }),
    );
  });

  it("rejects a non-numeric amount", () => {
    expect(() => validatePositiveAmount("abc")).toThrow(
      expect.objectContaining({ code: F02_ERROR_CODES.INVALID_INPUT }),
    );
  });
});
