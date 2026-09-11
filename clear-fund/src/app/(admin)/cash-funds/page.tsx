import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { auth, ROLES } from "@/lib/auth";
import { formatMoneyDisplay } from "@/lib/money";
import { listCashFunds } from "@/modules/cash-funds/application";
import { CashFundRowActions } from "@/modules/cash-funds/ui/cash-fund-row-actions";
import { CreateCashFundDialog } from "@/modules/cash-funds/ui/create-cash-fund-dialog";
import type { CashFundStatus } from "@/modules/cash-funds/domain/dto";
import { listAssignedCashFunds } from "@/modules/treasurer-assignments/application";

const STATUS_LABELS: Record<CashFundStatus, string> = {
  DRAFT: "Borrador",
  ACTIVE: "Activa",
  INACTIVE: "Inactiva",
};

const STATUS_VARIANTS: Record<
  CashFundStatus,
  "outline" | "default" | "destructive"
> = {
  DRAFT: "outline",
  ACTIVE: "default",
  INACTIVE: "destructive",
};

export default async function CashFundsPage() {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });

  // The (admin) layout already ensures a session exists.
  if (!session) {
    redirect("/login");
  }

  const isSuperAdmin = session.user.role === ROLES.SUPER_ADMIN;

  // FR-F03-002 / BR-F03-005: a treasurer sees only their ACTIVE-assigned funds.
  // The treasurer-assignments module owns this query (single source of truth).
  let assignedFundIds = new Set<string>();
  if (!isSuperAdmin) {
    assignedFundIds = new Set(
      await listAssignedCashFunds({ headers: requestHeaders }),
    );
  }

  // ARCHITECTURE.md: pages call use cases, never Prisma directly — the
  // fund-visibility rule itself lives in lib/permissions, resolved once
  // inside listCashFunds (single source of truth, finding 1).
  const funds = await listCashFunds({ headers: requestHeaders });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium">Cajas de ahorro</h1>
          <p className="text-muted-foreground text-sm">
            Administrá el ciclo de vida de las cajas.
          </p>
        </div>
        {isSuperAdmin ? <CreateCashFundDialog /> : null}
      </div>

      <div className="bg-card rounded-2xl border p-2">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Cuota mensual</TableHead>
              <TableHead>Moneda</TableHead>
              <TableHead>Día recom. / máx.</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {funds.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-muted-foreground py-8 text-center"
                >
                  No hay cajas todavía.
                </TableCell>
              </TableRow>
            ) : (
              funds.map((fund) => (
                <TableRow key={fund.id}>
                  <TableCell className="font-medium">{fund.name}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANTS[fund.status]}>
                      {STATUS_LABELS[fund.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {formatMoneyDisplay(fund.monthlySavingAmount, fund.currency)}
                  </TableCell>
                  <TableCell>{fund.currency}</TableCell>
                  <TableCell>
                    {fund.recommendedDay} / {fund.maximumDay}
                  </TableCell>
                  <TableCell className="text-right">
                    <CashFundRowActions
                      fund={fund}
                      isSuperAdmin={isSuperAdmin}
                      canEditConfig={
                        isSuperAdmin || assignedFundIds.has(fund.id)
                      }
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
