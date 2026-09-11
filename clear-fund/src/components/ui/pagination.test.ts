import { describe, expect, it } from "vitest";

import { clampPage, computeTotalPages } from "./pagination";

describe("computeTotalPages", () => {
  it("rounds up to a whole page", () => {
    expect(computeTotalPages(30, 25)).toBe(2);
  });

  it("never reports fewer than 1 page, even with zero results", () => {
    expect(computeTotalPages(0, 25)).toBe(1);
  });
});

describe("clampPage", () => {
  // Reproduces finding 4.b: ?page=999 against 3 results (1 page at the
  // default page size) must land the caller back on the last real page
  // instead of stranding them on an empty table with no way back.
  it("clamps a page past the last page down to the last page", () => {
    const totalPages = computeTotalPages(3, 25);
    expect(clampPage(999, totalPages)).toBe(1);
  });

  it("clamps a non-positive page up to the first page", () => {
    expect(clampPage(0, 5)).toBe(1);
    expect(clampPage(-3, 5)).toBe(1);
  });

  it("leaves an in-range page untouched", () => {
    expect(clampPage(2, 5)).toBe(2);
  });
});
