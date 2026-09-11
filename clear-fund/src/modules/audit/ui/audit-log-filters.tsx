"use client";

import { useRouter } from "next/navigation";

import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useFilterQuery } from "@/hooks/use-filter-query";
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
  const applyFilterParam = useFilterQuery();

  function apply(key: string, value: string) {
    const query = applyFilterParam(key, value);
    router.push(query ? `/audit?${query}` : "/audit");
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="audit-fund-filter">Caja</Label>
        <Select
          id="audit-fund-filter"
          className="sm:w-56"
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
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="audit-action-filter">Acción</Label>
        <Select
          id="audit-action-filter"
          className="sm:w-56"
          value={selectedAction}
          onChange={(event) => apply("action", event.target.value)}
        >
          <option value="">Todas las acciones</option>
          {ACTION_OPTIONS.map(([action, label]) => (
            <option key={action} value={action}>
              {label}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}
