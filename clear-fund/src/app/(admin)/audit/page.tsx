import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
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
import { cn } from "@/lib/utils";
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
  // `pageSize` is honoured from the URL so the page length is adjustable without
  // a code change. The schema validates and caps it (1..AUDIT_PAGE_SIZE_MAX), so
  // a bogus or oversized value cannot widen the query; empty means the default.
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
    result = await listAuditEvents(
      {
        ...(selectedCashFundId ? { cashFundId: selectedCashFundId } : {}),
        ...(selectedAction ? { action: selectedAction } : {}),
        ...(selectedPageSize ? { pageSize: selectedPageSize } : {}),
        page,
      },
      { headers: requestHeaders },
    );
  } catch (caught) {
    // Functional message only; internals never reach the user.
    error =
      caught instanceof AuditError
        ? "No se pudo cargar la auditoría con esos filtros."
        : "No se pudo cargar la auditoría. Intentá de nuevo.";
  }

  const totalPages = result ? Math.max(1, Math.ceil(result.total / result.pageSize)) : 1;

  function pageHref(target: number): string {
    const next = new URLSearchParams();
    if (selectedCashFundId) {
      next.set("cashFundId", selectedCashFundId);
    }
    if (selectedAction) {
      next.set("action", selectedAction);
    }
    // Carried across pages: dropping it would silently reset the page length on
    // the first Next/Previous click.
    if (selectedPageSize) {
      next.set("pageSize", selectedPageSize);
    }
    if (target > 1) {
      next.set("page", String(target));
    }
    return next.size > 0 ? `/audit?${next.toString()}` : "/audit";
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

      {error ? (
        <p
          role="alert"
          className="text-destructive bg-card rounded-2xl border p-6 text-sm"
        >
          {error}
        </p>
      ) : (
        <>
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
                {result === null || result.events.length === 0 ? (
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

          {result !== null && result.total > result.pageSize ? (
            <nav
              aria-label="Paginación de auditoría"
              className="flex items-center justify-between gap-4"
            >
              <p className="text-muted-foreground text-sm">
                Página {result.page} de {totalPages} · {result.total} eventos
              </p>
              <div className="flex gap-2">
                <PageLink
                  href={pageHref(result.page - 1)}
                  disabled={result.page <= 1}
                >
                  Anterior
                </PageLink>
                <PageLink
                  href={pageHref(result.page + 1)}
                  disabled={result.page >= totalPages}
                >
                  Siguiente
                </PageLink>
              </div>
            </nav>
          ) : null}
        </>
      )}
    </div>
  );
}
