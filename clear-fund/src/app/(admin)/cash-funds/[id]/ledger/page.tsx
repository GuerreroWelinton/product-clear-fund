import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { auth } from "@/lib/auth";
import { BUSINESS_TIME_ZONE } from "@/lib/dates";
import { formatMoneyDisplay } from "@/lib/money";
import {
  getCashFundBalance,
  getCashFundHeader,
  listCashMovements,
} from "@/modules/ledger/application";
import { F20_ERROR_CODES, LedgerError } from "@/modules/ledger/domain/errors";
import {
  cashMovementSourceTypeLabel,
  cashMovementTypeLabel,
} from "@/modules/ledger/domain/movement-types";
import { LedgerFilters } from "@/modules/ledger/ui/ledger-filters";

const dateTimeFormatter = new Intl.DateTimeFormat("es-EC", {
  dateStyle: "short",
  timeStyle: "short",
  // Same zone the date filters resolve in; timestamps are stored UTC.
  timeZone: BUSINESS_TIME_ZONE,
});

function messageForError(caught: unknown): string {
  if (!(caught instanceof LedgerError)) {
    return "No se pudo cargar el libro de caja. Intentá de nuevo.";
  }
  switch (caught.code) {
    case F20_ERROR_CODES.UNAUTHORIZED:
      return "No tenés permiso para ver el libro de esta caja.";
    case F20_ERROR_CODES.CASH_FUND_NOT_FOUND:
      return "Esta caja no existe.";
    case F20_ERROR_CODES.INVALID_INPUT:
      return "Los filtros del libro de caja no son válidos. Revisalos e intentá de nuevo.";
    default:
      return "No se pudo cargar el libro de caja. Intentá de nuevo.";
  }
}

// BR-F20-001: one fund, one total balance — meaningless without a specific
// fund, so the ledger lives at a per-fund route.
export default async function CashFundLedgerPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id: cashFundId } = await params;
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });

  // The (admin) layout already ensures a session exists.
  if (!session) {
    redirect("/login");
  }

  const query = await searchParams;
  const selectedDirection = firstValue(query.direction);
  const selectedMovementType = firstValue(query.movementType);
  const selectedFromDate = firstValue(query.fromDate);
  const selectedToDate = firstValue(query.toDate);
  const pageParam = Number.parseInt(firstValue(query.page), 10);
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
  // Deliberately not exposed in the UI — see src/lib/pagination for why
  // reading it straight from the URL is safe.
  const selectedPageSize = firstValue(query.pageSize);

  const ctx = { headers: requestHeaders };

  let balance: Awaited<ReturnType<typeof getCashFundBalance>> | null = null;
  let movementsPage: Awaited<ReturnType<typeof listCashMovements>> | null = null;
  let fundName: string | null = null;
  let error: string | null = null;

  try {
    const baseInput = {
      cashFundId,
      ...(selectedDirection
        ? { direction: selectedDirection as "IN" | "OUT" }
        : {}),
      ...(selectedMovementType ? { movementType: selectedMovementType } : {}),
      ...(selectedFromDate ? { fromDate: selectedFromDate } : {}),
      ...(selectedToDate ? { toDate: selectedToDate } : {}),
      ...(selectedPageSize ? { pageSize: selectedPageSize } : {}),
    };
    let header: Awaited<ReturnType<typeof getCashFundHeader>>;
    [balance, movementsPage, header] = await Promise.all([
      getCashFundBalance({ cashFundId }, ctx),
      listCashMovements({ ...baseInput, page }, ctx),
      // Authorizes itself the same way (requireSuperAdminOrAssignedTreasurer,
      // same cashFundId): if any of the three rejects, Promise.all rejects
      // and the fund's name is never disclosed to the caller.
      getCashFundHeader({ cashFundId }, ctx),
    ]);
    fundName = header.name;
  } catch (caught) {
    // Functional message only; internals never reach the user.
    error = messageForError(caught);
  }

  if (error || !balance || !movementsPage) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-medium">Libro de caja</h1>
        </div>
        <p
          role="alert"
          className="text-destructive bg-card rounded-2xl border p-6 text-sm"
        >
          {error ?? "No se pudo cargar el libro de caja. Intentá de nuevo."}
        </p>
      </div>
    );
  }

  function pageHref(target: number): string {
    return buildPageHref(
      `/cash-funds/${cashFundId}/ledger`,
      {
        direction: selectedDirection,
        movementType: selectedMovementType,
        fromDate: selectedFromDate,
        toDate: selectedToDate,
      },
      target,
      selectedPageSize,
    );
  }

  const totalPages = computeTotalPages(movementsPage.total, movementsPage.pageSize);

  // Finding 4.b follow-up: an out-of-range page (e.g. ?page=999 with only 3
  // results) must not strand the caller on data that mismatches the URL —
  // redirect to the canonical URL for the in-range page instead of quietly
  // rendering different data than `?page=` claims. This already sits outside
  // the try/catch above: `redirect()` works by throwing, and that catch is
  // scoped to the fetch's own errors — it would otherwise swallow the
  // redirect and render the error state instead of navigating.
  const plan = resolvePagePlan(page, totalPages);
  if (plan.kind === "redirect") {
    redirect(pageHref(plan.page));
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-medium">
          Libro de caja{fundName ? ` · ${fundName}` : ""}
        </h1>
        <p className="text-muted-foreground text-sm">
          Movimientos inmutables y saldos derivados de esta caja.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Saldo contable</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-medium">
            {formatMoneyDisplay(balance.accountingBalance, balance.currency)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Saldo comprometido</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-medium">
            {formatMoneyDisplay(balance.committedBalance, balance.currency)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Saldo libre</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-medium">
            {formatMoneyDisplay(balance.freeBalance, balance.currency)}
          </CardContent>
        </Card>
      </div>

      <LedgerFilters
        cashFundId={cashFundId}
        selectedDirection={selectedDirection}
        selectedMovementType={selectedMovementType}
        selectedFromDate={selectedFromDate}
        selectedToDate={selectedToDate}
      />

      <div className="bg-card overflow-x-auto rounded-2xl border p-2">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Dirección</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Origen</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead className="text-right">Monto</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {movementsPage.movements.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-muted-foreground py-8 text-center"
                >
                  Esta caja todavía no registra movimientos.
                </TableCell>
              </TableRow>
            ) : (
              movementsPage.movements.map((movement) => (
                <TableRow key={movement.id}>
                  <TableCell className="whitespace-nowrap">
                    {dateTimeFormatter.format(new Date(movement.occurredAt))}
                  </TableCell>
                  <TableCell>
                    <Badge variant={movement.direction === "IN" ? "default" : "destructive"}>
                      {movement.direction === "IN" ? "Entrada" : "Salida"}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    {cashMovementTypeLabel(movement.movementType)}
                  </TableCell>
                  <TableCell>
                    {cashMovementSourceTypeLabel(movement.sourceType)}
                  </TableCell>
                  <TableCell className="break-all">{movement.actorEmail}</TableCell>
                  <TableCell className="text-right">
                    {formatMoneyDisplay(movement.amount, balance.currency)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <PaginationNav
        ariaLabel="Paginación del libro de caja"
        itemsLabel="movimientos"
        page={movementsPage.page}
        totalPages={totalPages}
        total={movementsPage.total}
        pageHref={pageHref}
      />
    </div>
  );
}
