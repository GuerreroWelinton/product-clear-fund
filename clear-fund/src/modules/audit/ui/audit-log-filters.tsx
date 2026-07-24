"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { Label } from "@/components/ui/label";
import {
  AUDIT_ACTION_LABELS,
  type AuditAction,
} from "@/modules/audit/domain/event-types";

interface AuditLogFiltersProps {
  // The funds the caller may read; empty for a treasurer with no assignments.
  funds: { id: string; name: string }[];
  // Whether "todas las cajas" also includes global (fund-less) events. Only a
  // Super Admin reads those (ADR-013), so the label must not over-promise.
  includesGlobalEvents: boolean;
  selectedCashFundId: string;
  selectedAction: string;
}

const ACTION_OPTIONS = Object.entries(AUDIT_ACTION_LABELS) as [
  AuditAction,
  string,
][];

// Filters drive the URL, so the server page stays the single place that queries
// the log and every filtered view is shareable and reloadable.
export function AuditLogFilters({
  funds,
  includesGlobalEvents,
  selectedCashFundId,
  selectedAction,
}: AuditLogFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function apply(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    // Any filter change invalidates the current page number.
    params.delete("page");
    router.push(params.size > 0 ? `/audit?${params.toString()}` : "/audit");
  }

  const selectClass =
    "border-input bg-background h-9 w-full rounded-full border px-3 text-sm sm:w-56";

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="audit-fund-filter">Caja</Label>
        <select
          id="audit-fund-filter"
          className={selectClass}
          value={selectedCashFundId}
          onChange={(event) => apply("cashFundId", event.target.value)}
        >
          <option value="">
            {includesGlobalEvents
              ? "Todas (incluye eventos globales)"
              : "Todas mis cajas"}
          </option>
          {funds.map((fund) => (
            <option key={fund.id} value={fund.id}>
              {fund.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="audit-action-filter">Acción</Label>
        <select
          id="audit-action-filter"
          className={selectClass}
          value={selectedAction}
          onChange={(event) => apply("action", event.target.value)}
        >
          <option value="">Todas las acciones</option>
          {ACTION_OPTIONS.map(([action, label]) => (
            <option key={action} value={action}>
              {label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
