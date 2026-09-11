import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import {
  PaginationNav,
  buildPageHref,
  clampPage,
  computeTotalPages,
  firstValue,
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
import { prisma } from "@/lib/db";
import { listAuditEvents } from "@/modules/audit/application/list-audit-events";
import { AuditError } from "@/modules/audit/domain/errors";
import {
  auditActionLabel,
  auditEntityLabel,
} from "@/modules/audit/domain/event-types";
import { AuditEventRowActions } from "@/modules/audit/ui/audit-event-row-actions";
import { AuditLogFilters } from "@/modules/audit/ui/audit-log-filters";
import { listAssignedCashFunds } from "@/modules/treasurer-assignments/application/list-assigned-cash-funds";

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
  // ones for a treasurer (F03 owns that query).
  const visibleFundIds = isSuperAdmin
    ? null
    : await listAssignedCashFunds({ headers: requestHeaders });
  const funds = await prisma.cashFund.findMany({
    where: visibleFundIds === null ? undefined : { id: { in: visibleFundIds } },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
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

    // Finding 4.b: an out-of-range page (e.g. ?page=999 with only 3 results)
    // must not strand the caller on an empty view — refetch the clamped page
    // when the requested one falls outside the range the data actually has.
    const clampedPage = clampPage(
      page,
      computeTotalPages(result.total, result.pageSize),
    );
    if (clampedPage !== result.page) {
      result = await listAuditEvents(
        { ...baseInput, page: clampedPage },
        { headers: requestHeaders },
      );
    }
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

  const totalPages = computeTotalPages(result.total, result.pageSize);

  function pageHref(target: number): string {
    return buildPageHref(
      "/audit",
      { cashFundId: selectedCashFundId, action: selectedAction },
      target,
      selectedPageSize,
    );
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
