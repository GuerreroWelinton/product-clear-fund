import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import {
  PaginationNav,
  buildPageHref,
  computeTotalPages,
  firstValue,
  resolvePagePlan,
} from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { auth, ROLES } from "@/lib/auth";
import { BUSINESS_TIME_ZONE } from "@/lib/dates";
import { listAuditEvents } from "@/modules/audit/application/list-audit-events";
import { AuditError } from "@/modules/audit/domain/errors";
import {
  auditActionLabel,
  auditEntityLabel,
} from "@/modules/audit/domain/event-types";
import { AuditEventRowActions } from "@/modules/audit/ui/audit-event-row-actions";
import { AuditLogFilters } from "@/modules/audit/ui/audit-log-filters";
import { listCashFunds } from "@/modules/cash-funds/application";

const dateTimeFormatter = new Intl.DateTimeFormat("es-EC", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: BUSINESS_TIME_ZONE,
});

// FR-F23-001 / FR-F23-002: the audit log. A Super Admin reads it globally
// (including fund-less events); a treasurer only their assigned funds. The scope
// is enforced in listAuditEvents, not here — this page just renders it.
export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });

  // The (admin) layout already ensures a session exists.
  if (!session) {
    redirect("/login");
  }

  const params = await searchParams;
  const selectedCashFundId = firstValue(params.cashFundId);
  const selectedAction = firstValue(params.action);
  const pageParam = Number.parseInt(firstValue(params.page), 10);
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
  // Deliberately not exposed in the UI — see src/lib/pagination for why
  // reading it straight from the URL is safe.
  const selectedPageSize = firstValue(params.pageSize);

  const isSuperAdmin = session.user.role === ROLES.SUPER_ADMIN;

  // Funds available in the filter: all of them for a Super Admin, the assigned
  // ones for a treasurer. listCashFunds owns that visibility rule (F03 +
  // lib/permissions, single source of truth) — this page only picks the
  // id/name pair the dropdown needs and sorts it for display.
  const visibleFunds = await listCashFunds({ headers: requestHeaders });
  const funds = visibleFunds
    .map((fund) => ({ id: fund.id, name: fund.name }))
    .sort((a, b) => a.name.localeCompare(b.name));
  const fundNames = new Map(funds.map((fund) => [fund.id, fund.name]));

  let result: Awaited<ReturnType<typeof listAuditEvents>> | null = null;
  let error: string | null = null;
  try {
    const baseInput = {
      ...(selectedCashFundId ? { cashFundId: selectedCashFundId } : {}),
      ...(selectedAction ? { action: selectedAction } : {}),
      ...(selectedPageSize ? { pageSize: selectedPageSize } : {}),
    };
    result = await listAuditEvents(
      { ...baseInput, page },
      { headers: requestHeaders },
    );
  } catch (caught) {
    // Functional message only; internals never reach the user.
    error =
      caught instanceof AuditError
        ? "No se pudo cargar la auditoría con esos filtros."
        : "No se pudo cargar la auditoría. Intentá de nuevo.";
  }

  // Finding 4.d: `result === null` here would only be reachable if `error`
  // were falsy while the try block never assigned `result` — impossible,
  // since the only path that leaves `result` unset is the catch block, which
  // always sets `error`. Aligning on the same early-return pattern as
  // /cash-funds/[id]/ledger removes that dead branch instead of guarding
  // against it twice below.
  if (error || !result) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-medium">Auditoría</h1>
          <p className="text-muted-foreground text-sm">
            {isSuperAdmin
              ? "Bitácora global de cambios. Los registros no pueden editarse ni eliminarse."
              : "Bitácora de tus cajas. Los registros no pueden editarse ni eliminarse."}
          </p>
        </div>

        <AuditLogFilters
          funds={funds}
          includesGlobalEvents={isSuperAdmin}
          selectedCashFundId={selectedCashFundId}
          selectedAction={selectedAction}
        />

        <p
          role="alert"
          className="text-destructive bg-card rounded-2xl border p-6 text-sm"
        >
          {error ?? "No se pudo cargar la auditoría. Intentá de nuevo."}
        </p>
      </div>
    );
  }

  function pageHref(target: number): string {
    return buildPageHref(
      "/audit",
      { cashFundId: selectedCashFundId, action: selectedAction },
      target,
      selectedPageSize,
    );
  }

  const totalPages = computeTotalPages(result.total, result.pageSize);

  // Finding 4.b follow-up: an out-of-range page (e.g. ?page=999 with only 3
  // results) must not strand the caller on data that mismatches the URL —
  // redirect to the canonical URL for the in-range page instead of quietly
  // rendering different data than `?page=` claims. This sits outside the
  // try/catch above on purpose: `redirect()` works by throwing, and the
  // catch there is scoped to the fetch's own errors — it would otherwise
  // swallow the redirect and render the error state instead of navigating.
  const plan = resolvePagePlan(page, totalPages);
  if (plan.kind === "redirect") {
    redirect(pageHref(plan.page));
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-medium">Auditoría</h1>
        <p className="text-muted-foreground text-sm">
          {isSuperAdmin
            ? "Bitácora global de cambios. Los registros no pueden editarse ni eliminarse."
            : "Bitácora de tus cajas. Los registros no pueden editarse ni eliminarse."}
        </p>
      </div>

      <AuditLogFilters
        funds={funds}
        includesGlobalEvents={isSuperAdmin}
        selectedCashFundId={selectedCashFundId}
        selectedAction={selectedAction}
      />

      <div className="bg-card overflow-x-auto rounded-2xl border p-2">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Acción</TableHead>
              <TableHead>Caja</TableHead>
              <TableHead>Entidad</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead className="text-right">Detalle</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.events.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-muted-foreground py-8 text-center"
                >
                  No hay eventos de auditoría para estos filtros.
                </TableCell>
              </TableRow>
            ) : (
              result.events.map((event) => (
                <TableRow key={event.id}>
                  <TableCell className="whitespace-nowrap">
                    {dateTimeFormatter.format(new Date(event.occurredAt))}
                  </TableCell>
                  <TableCell className="font-medium">
                    {auditActionLabel(event.action)}
                  </TableCell>
                  <TableCell>
                    {event.cashFundId === null ? (
                      <Badge variant="outline">Global</Badge>
                    ) : (
                      (fundNames.get(event.cashFundId) ?? event.cashFundId)
                    )}
                  </TableCell>
                  <TableCell>{auditEntityLabel(event.entityType)}</TableCell>
                  <TableCell className="break-all">
                    {event.actorEmail ?? "Sistema"}
                  </TableCell>
                  <TableCell className="text-right">
                    <AuditEventRowActions eventId={event.id} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <PaginationNav
        ariaLabel="Paginación de auditoría"
        itemsLabel="eventos"
        page={result.page}
        totalPages={totalPages}
        total={result.total}
        pageHref={pageHref}
      />
    </div>
  );
}
