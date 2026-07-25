import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { cn } from "@/lib/utils";
import { getCashFundBalance, listCashMovements } from "@/modules/ledger/application";
import { F20_ERROR_CODES, LedgerError } from "@/modules/ledger/domain/errors";
import {
  cashMovementSourceTypeLabel,
  cashMovementTypeLabel,
} from "@/modules/ledger/domain/movement-types";
import { LedgerFilters } from "@/modules/ledger/ui/ledger-filters";

const currencyFormatter = new Intl.NumberFormat("es-EC", {
  style: "currency",
  currency: "USD",
});

const dateTimeFormatter = new Intl.DateTimeFormat("es-EC", {
  dateStyle: "short",
  timeStyle: "short",
  // Business timezone (TECHNICAL_CONVENTIONS.md); timestamps are stored UTC.
  timeZone: "America/Guayaquil",
});

function formatAmount(amount: string, currency: string): string {
  const value = Number(amount);
  if (currency === "USD") {
    return currencyFormatter.format(value);
  }
  return `${value.toFixed(2)} ${currency}`;
}

// A pagination control (mirrors /audit's PageLink): a plain anchor wearing
// button styles, not Button+Link, so paginating keeps link semantics.
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

function firstValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }
  return value ?? "";
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
  const selectedPageSize = firstValue(query.pageSize);

  const ctx = { headers: requestHeaders };

  let balance: Awaited<ReturnType<typeof getCashFundBalance>> | null = null;
  let movementsPage: Awaited<ReturnType<typeof listCashMovements>> | null = null;
  let fundName: string | null = null;
  let error: string | null = null;

  try {
    [balance, movementsPage] = await Promise.all([
      getCashFundBalance({ cashFundId }, ctx),
      listCashMovements(
        {
          cashFundId,
          ...(selectedDirection
            ? { direction: selectedDirection as "IN" | "OUT" }
            : {}),
          ...(selectedMovementType ? { movementType: selectedMovementType } : {}),
          ...(selectedFromDate ? { fromDate: selectedFromDate } : {}),
          ...(selectedToDate ? { toDate: selectedToDate } : {}),
          ...(selectedPageSize ? { pageSize: selectedPageSize } : {}),
          page,
        },
        ctx,
      ),
    ]);

    // Only after the use cases authorized the caller: naming the fund before
    // that would disclose a fund the caller may not see.
    const fund = await prisma.cashFund.findUnique({
      where: { id: cashFundId },
      select: { name: true },
    });
    fundName = fund?.name ?? null;
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

  const totalPages = Math.max(1, Math.ceil(movementsPage.total / movementsPage.pageSize));

  function pageHref(target: number): string {
    const next = new URLSearchParams();
    if (selectedDirection) next.set("direction", selectedDirection);
    if (selectedMovementType) next.set("movementType", selectedMovementType);
    if (selectedFromDate) next.set("fromDate", selectedFromDate);
    if (selectedToDate) next.set("toDate", selectedToDate);
    if (selectedPageSize) next.set("pageSize", selectedPageSize);
    if (target > 1) next.set("page", String(target));
    const query = next.toString();
    return query
      ? `/cash-funds/${cashFundId}/ledger?${query}`
      : `/cash-funds/${cashFundId}/ledger`;
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
            {formatAmount(balance.accountingBalance, balance.currency)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Saldo comprometido</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-medium">
            {formatAmount(balance.committedBalance, balance.currency)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Saldo libre</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-medium">
            {formatAmount(balance.freeBalance, balance.currency)}
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
                    {formatAmount(movement.amount, balance.currency)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {movementsPage.total > movementsPage.pageSize ? (
        <nav
          aria-label="Paginación del libro de caja"
          className="flex items-center justify-between gap-4"
        >
          <p className="text-muted-foreground text-sm">
            Página {movementsPage.page} de {totalPages} · {movementsPage.total} movimientos
          </p>
          <div className="flex gap-2">
            <PageLink
              href={pageHref(movementsPage.page - 1)}
              disabled={movementsPage.page <= 1}
            >
              Anterior
            </PageLink>
            <PageLink
              href={pageHref(movementsPage.page + 1)}
              disabled={movementsPage.page >= totalPages}
            >
              Siguiente
            </PageLink>
          </div>
        </nav>
      ) : null}
    </div>
  );
}
