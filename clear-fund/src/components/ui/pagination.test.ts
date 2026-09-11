import { describe, expect, it } from "vitest";

import { clampPage, computeTotalPages, resolvePagePlan } from "./pagination";

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

describe("resolvePagePlan", () => {
  // The redirect-instead-of-refetch decision (finding 4.b follow-up): an
  // in-range request renders directly, an out-of-range one names the
  // canonical page to redirect to instead of silently serving different
  // data than the URL claims.
  it("renders directly when the requested page is already in range", () => {
    expect(resolvePagePlan(2, 5)).toEqual({ kind: "render" });
  });

  it("renders directly for a single-page, zero-result table", () => {
    expect(resolvePagePlan(1, 1)).toEqual({ kind: "render" });
  });

  it("redirects to the last page when the requested page overshoots", () => {
    expect(resolvePagePlan(999, 3)).toEqual({ kind: "redirect", page: 3 });
  });

  it("redirects to the first page when the requested page is non-positive", () => {
    expect(resolvePagePlan(0, 5)).toEqual({ kind: "redirect", page: 1 });
    expect(resolvePagePlan(-3, 5)).toEqual({ kind: "redirect", page: 1 });
  });

  // Convergence / no-loop guarantee: replaying the plan's own target page
  // against the same totalPages must always resolve to "render" — otherwise
  // a redirect could bounce more than once.
  it("converges: redirecting once always lands on a page that renders", () => {
    const cases: Array<[page: number, totalPages: number]> = [
      [999, 3],
      [0, 1],
      [-5, 10],
      [7, 1],
      [2, 2],
    ];
    for (const [page, totalPages] of cases) {
      const plan = resolvePagePlan(page, totalPages);
      const target = plan.kind === "redirect" ? plan.page : page;
      expect(resolvePagePlan(target, totalPages)).toEqual({ kind: "render" });
    }
  });
});
