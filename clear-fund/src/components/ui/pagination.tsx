import * as React from "react";
import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// A pagination control.
//
// When navigable it is a plain anchor wearing the button styles, NOT the Button
// primitive with a Link inside it: paginating is navigation, so it must keep link
// semantics (open in a new tab, native Enter) and Base UI's Button would layer
// native-button semantics onto an `<a>` that does not have them.
// At the edges it is a real disabled `<button>` — never a `<span disabled>`,
// which is invalid HTML.
function PageLink({
  href,
  disabled,
  children,
}: {
  href: string;
  disabled: boolean;
  children: React.ReactNode;
}) {
  if (disabled) {
    return (
      <Button variant="outline" size="sm" className="rounded-full" disabled>
        {children}
      </Button>
    );
  }
  return (
    <Link
      href={href}
      className={cn(
        buttonVariants({ variant: "outline", size: "sm" }),
        "rounded-full",
      )}
    >
      {children}
    </Link>
  );
}

// Single-value reader: Next passes repeated query params as arrays.
function firstValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }
  return value ?? "";
}

// Builds one page's href from a base path, the active filters (falsy entries
// omitted, insertion order preserved), the target page, and the raw pageSize
// string carried from the URL. `pageSize` is carried unmodified across pages:
// dropping it would silently reset the page length on the first Next/Previous
// click. `page` itself is omitted for page 1 so the first page keeps a clean URL.
function buildPageHref(
  basePath: string,
  filters: Record<string, string | undefined>,
  page: number,
  pageSize: string,
): string {
  const next = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) {
      next.set(key, value);
    }
  }
  if (pageSize) {
    next.set("pageSize", pageSize);
  }
  if (page > 1) {
    next.set("page", String(page));
  }
  const query = next.toString();
  return query ? `${basePath}?${query}` : basePath;
}

// The "Página X de Y · N <items>" bar shared by every paginated table.
// `ariaLabel` and `itemsLabel` differ per table on purpose (audit vs ledger);
// everything else about the control is identical.
function PaginationNav({
  ariaLabel,
  itemsLabel,
  page,
  totalPages,
  total,
  pageHref,
}: {
  ariaLabel: string;
  itemsLabel: string;
  page: number;
  totalPages: number;
  total: number;
  pageHref: (target: number) => string;
}) {
  // A single page of results needs no navigation. Expressed via totalPages
  // (finding 4.b) rather than `total <= pageSize`: totalPages is what the
  // page number is actually clamped against, so this is the same rule stated
  // in terms of the value both callers already computed for the clamp.
  if (totalPages <= 1) {
    return null;
  }
  return (
    <nav
      aria-label={ariaLabel}
      className="flex items-center justify-between gap-4"
    >
      <p className="text-muted-foreground text-sm">
        Página {page} de {totalPages} · {total} {itemsLabel}
      </p>
      <div className="flex gap-2">
        <PageLink href={pageHref(page - 1)} disabled={page <= 1}>
          Anterior
        </PageLink>
        <PageLink href={pageHref(page + 1)} disabled={page >= totalPages}>
          Siguiente
        </PageLink>
      </div>
    </nav>
  );
}

// Total pages for a result set. Never less than 1, so a zero-result table
// still has a well-defined "page 1 of 1" to render instead of "page 1 of 0".
function computeTotalPages(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(total / pageSize));
}

// Clamps a requested page into the range the data actually has (min 1, max
// totalPages). An out-of-range page — e.g. ?page=999 against 3 results — must
// not strand the caller on an empty view with no way back; called by both
// pages before they render, so a bad page number always resolves to the
// closest real page instead.
function clampPage(page: number, totalPages: number): number {
  if (page < 1) {
    return 1;
  }
  if (page > totalPages) {
    return totalPages;
  }
  return page;
}

// The render-vs-redirect decision for an out-of-range page. Pulled out as a
// pure function so it is unit-testable on its own (pages are not rendered by
// any test in this project): given the requested page and the range the data
// actually has, either the request is already canonical ("render") or it
// names the in-range page the caller must be redirected to instead of being
// silently served different data than the URL claims.
//
// Convergence: `clampPage` is idempotent (clamping an already in-range page
// returns it unchanged), so replaying this function with a redirect's own
// target page and the same totalPages always yields "render" — a redirect
// never bounces more than once. See the "converges" test below.
type PagePlan = { kind: "render" } | { kind: "redirect"; page: number };

function resolvePagePlan(page: number, totalPages: number): PagePlan {
  const clamped = clampPage(page, totalPages);
  return clamped === page ? { kind: "render" } : { kind: "redirect", page: clamped };
}

export {
  PageLink,
  PaginationNav,
  firstValue,
  buildPageHref,
  computeTotalPages,
  clampPage,
  resolvePagePlan,
};
export type { PagePlan };
