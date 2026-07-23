"use client";

import { MoreHorizontalIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  activateCashFundAction,
  deactivateCashFundAction,
  type ActionResult,
} from "@/modules/cash-funds/application/actions";
import type { CashFundDto } from "@/modules/cash-funds/domain/dto";
import { EditCashFundDraftDialog } from "@/modules/cash-funds/ui/edit-cash-fund-draft-dialog";
import { OperationalConfigDialog } from "@/modules/cash-funds/ui/operational-config-dialog";
import { ManageTreasurersDialog } from "@/modules/treasurer-assignments/ui/manage-treasurers-dialog";

interface CashFundRowActionsProps {
  fund: CashFundDto;
  isSuperAdmin: boolean;
  canEditConfig: boolean;
}

export function CashFundRowActions({
  fund,
  isSuperAdmin,
  canEditConfig,
}: CashFundRowActionsProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editOpen, setEditOpen] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [confirmActivate, setConfirmActivate] = useState(false);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);

  function run(action: () => Promise<ActionResult>, successText: string) {
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        toast.success(successText);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  const canEditDraft = isSuperAdmin && fund.status === "DRAFT";
  const canOpenConfig = canEditConfig && fund.status === "ACTIVE";
  const canActivate =
    isSuperAdmin && (fund.status === "DRAFT" || fund.status === "INACTIVE");
  const canDeactivate = isSuperAdmin && fund.status === "ACTIVE";
  const isReactivate = fund.status === "INACTIVE";
  // FR-F03-001: only the Super Admin manages treasurer assignments.
  const canManageTreasurers = isSuperAdmin;

  const hasAnyAction =
    canEditDraft ||
    canOpenConfig ||
    canManageTreasurers ||
    canActivate ||
    canDeactivate;

  if (!hasAnyAction) {
    return <span className="text-muted-foreground text-xs">—</span>;
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          disabled={pending}
          aria-label={`Acciones para ${fund.name}`}
          className={cn(
            buttonVariants({ variant: "ghost", size: "icon" }),
            "rounded-full",
          )}
        >
          <MoreHorizontalIcon className="size-4" aria-hidden />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {canEditDraft ? (
            <DropdownMenuItem onClick={() => setEditOpen(true)}>
              Editar borrador
            </DropdownMenuItem>
          ) : null}
          {canOpenConfig ? (
            <DropdownMenuItem onClick={() => setConfigOpen(true)}>
              Configuración operativa
            </DropdownMenuItem>
          ) : null}
          {canManageTreasurers ? (
            <DropdownMenuItem onClick={() => setManageOpen(true)}>
              Gestionar tesoreros
            </DropdownMenuItem>
          ) : null}
          {canActivate ? (
            <DropdownMenuItem onClick={() => setConfirmActivate(true)}>
              {isReactivate ? "Reactivar" : "Activar"}
            </DropdownMenuItem>
          ) : null}
          {canDeactivate ? (
            <DropdownMenuItem
              variant="destructive"
              onClick={() => setConfirmDeactivate(true)}
            >
              Desactivar
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      {canEditDraft ? (
        <EditCashFundDraftDialog
          fund={fund}
          open={editOpen}
          onOpenChange={setEditOpen}
        />
      ) : null}

      {canOpenConfig ? (
        <OperationalConfigDialog
          fund={fund}
          open={configOpen}
          onOpenChange={setConfigOpen}
        />
      ) : null}

      {canManageTreasurers ? (
        <ManageTreasurersDialog
          cashFundId={fund.id}
          cashFundName={fund.name}
          open={manageOpen}
          onOpenChange={setManageOpen}
        />
      ) : null}

      <AlertDialog open={confirmActivate} onOpenChange={setConfirmActivate}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isReactivate ? "Reactivar" : "Activar"} {fund.name}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isReactivate
                ? "La caja volverá a operar con su configuración anterior."
                : "La caja pasará a estado activo y sus parámetros estructurales quedarán bloqueados."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-full"
              onClick={() => {
                setConfirmActivate(false);
                run(
                  () => activateCashFundAction({ cashFundId: fund.id }),
                  isReactivate ? "Caja reactivada." : "Caja activada.",
                );
              }}
            >
              {isReactivate ? "Reactivar" : "Activar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={confirmDeactivate}
        onOpenChange={setConfirmDeactivate}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desactivar {fund.name}</AlertDialogTitle>
            <AlertDialogDescription>
              La caja dejará de operar hasta que se reactive. Podés volver a
              activarla más tarde.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-full"
              onClick={() => {
                setConfirmDeactivate(false);
                run(
                  () => deactivateCashFundAction({ cashFundId: fund.id }),
                  "Caja desactivada.",
                );
              }}
            >
              Desactivar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
