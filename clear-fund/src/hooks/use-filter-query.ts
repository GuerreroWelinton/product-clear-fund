"use client";

import { useSearchParams } from "next/navigation";

// Shared core of the URL-driven filters (audit-log-filters.tsx /
// ledger-filters.tsx): given a filter key/value change, returns the next
// query string built from the current search params. Any filter change
// invalidates the current page number, so pagination is always reset. Each
// caller still builds its own path, since that part differs per module.
export function useFilterQuery() {
  const searchParams = useSearchParams();

  return function applyFilterParam(key: string, value: string): string {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    params.delete("page");
    return params.toString();
  };
}
