"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CASH_MOVEMENT_DIRECTION_LABELS,
  CASH_MOVEMENT_TYPE_LABELS,
} from "@/modules/ledger/domain/movement-types";

interface LedgerFiltersProps {
  cashFundId: string;
  selectedDirection: string;
  selectedMovementType: string;
  selectedFromDate: string;
  selectedToDate: string;
}

const DIRECTION_OPTIONS = Object.entries(CASH_MOVEMENT_DIRECTION_LABELS);
const MOVEMENT_TYPE_OPTIONS = Object.entries(CASH_MOVEMENT_TYPE_LABELS);

// Filters drive the URL, so the server page stays the single place that
// queries the ledger and every filtered view is shareable and reloadable
// (mirrors audit-log-filters.tsx).
export function LedgerFilters({
  cashFundId,
  selectedDirection,
  selectedMovementType,
  selectedFromDate,
  selectedToDate,
}: LedgerFiltersProps) {
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
    const query = params.toString();
    router.push(
      query
        ? `/cash-funds/${cashFundId}/ledger?${query}`
        : `/cash-funds/${cashFundId}/ledger`,
    );
  }

  const selectClass =
    "border-input bg-background h-9 w-full rounded-full border px-3 text-sm sm:w-48";

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:flex-wrap">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ledger-direction-filter">Dirección</Label>
        <select
          id="ledger-direction-filter"
          className={selectClass}
          value={selectedDirection}
          onChange={(event) => apply("direction", event.target.value)}
        >
          <option value="">Todas</option>
          {DIRECTION_OPTIONS.map(([direction, label]) => (
            <option key={direction} value={direction}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ledger-type-filter">Tipo de movimiento</Label>
        <select
          id="ledger-type-filter"
          className={selectClass}
          value={selectedMovementType}
          onChange={(event) => apply("movementType", event.target.value)}
        >
          <option value="">Todos</option>
          {MOVEMENT_TYPE_OPTIONS.map(([type, label]) => (
            <option key={type} value={type}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ledger-from-date-filter">Desde</Label>
        <Input
          id="ledger-from-date-filter"
          type="date"
          className="h-9 w-full rounded-full sm:w-40"
          value={selectedFromDate}
          onChange={(event) => apply("fromDate", event.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ledger-to-date-filter">Hasta</Label>
        <Input
          id="ledger-to-date-filter"
          type="date"
          className="h-9 w-full rounded-full sm:w-40"
          value={selectedToDate}
          onChange={(event) => apply("toDate", event.target.value)}
        />
      </div>
    </div>
  );
}
