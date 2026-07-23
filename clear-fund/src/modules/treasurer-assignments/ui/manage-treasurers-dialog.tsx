"use client";

import { Loader2Icon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  assignTreasurerAction,
  listFundAssignmentsAction,
  unassignTreasurerAction,
} from "@/modules/treasurer-assignments/application/actions";
import type { FundTreasurerDto } from "@/modules/treasurer-assignments/domain/dto";

interface ManageTreasurersDialogProps {
  cashFundId: string;
  cashFundName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ManageTreasurersDialog({
  cashFundId,
  cashFundName,
  open,
  onOpenChange,
}: ManageTreasurersDialogProps) {
  const [treasurers, setTreasurers] = useState<FundTreasurerDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);

  // Shared fetch used by the toggle handler (an event handler — setState here
  // is fine). The initial load runs inside the effect as an async IIFE so the
  // state updates land AFTER the await, not synchronously in the effect body
  // (react-hooks/set-state-in-effect). Loading state is reset on close.
  const load = useCallback(async () => {
    const result = await listFundAssignmentsAction({ cashFundId });
    if (result.ok) {
      setTreasurers(result.treasurers);
      setError(null);
    } else {
      setError(result.message);
      setTreasurers([]);
    }
  }, [cashFundId]);

  useEffect(() => {
    if (!open) {
      return;
    }
    let active = true;
    void (async () => {
      const result = await listFundAssignmentsAction({ cashFundId });
      if (!active) {
        return;
      }
      if (result.ok) {
        setTreasurers(result.treasurers);
        setError(null);
      } else {
        setError(result.message);
        setTreasurers([]);
      }
    })();
    return () => {
      active = false;
    };
  }, [open, cashFundId]);

  async function toggle(treasurer: FundTreasurerDto) {
    setPendingUserId(treasurer.userId);
    const result = treasurer.assigned
      ? await unassignTreasurerAction({ cashFundId, userId: treasurer.userId })
      : await assignTreasurerAction({ cashFundId, userId: treasurer.userId });
    setPendingUserId(null);

    if (result.ok) {
      toast.success(
        treasurer.assigned ? "Asignación retirada." : "Tesorero asignado.",
      );
      await load();
    } else {
      toast.error(result.message);
    }
  }

  const isLoading = treasurers === null;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) {
          setTreasurers(null);
          setError(null);
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tesoreros de {cashFundName}</DialogTitle>
          <DialogDescription>
            Asigná o retirá tesoreros. Retirar el acceso no borra el historial
            del tesorero.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="text-muted-foreground flex items-center gap-2 py-8 text-sm">
            <Loader2Icon className="size-4 animate-spin" aria-hidden />
            Cargando tesoreros…
          </div>
        ) : error ? (
          <p role="alert" className="text-destructive py-8 text-sm">
            {error}
          </p>
        ) : treasurers.length === 0 ? (
          <p className="text-muted-foreground py-8 text-sm">
            No hay cuentas de tesorero todavía. Creá una en la sección Usuarios.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {treasurers.map((treasurer) => (
              <li
                key={treasurer.userId}
                className="flex items-center justify-between gap-3 rounded-xl border p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {treasurer.name}
                  </p>
                  <p className="text-muted-foreground truncate text-xs">
                    {treasurer.email}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {treasurer.assigned ? (
                    <Badge variant="default">Asignado</Badge>
                  ) : null}
                  <Button
                    type="button"
                    size="sm"
                    variant={treasurer.assigned ? "outline" : "default"}
                    className="rounded-full"
                    disabled={pendingUserId !== null}
                    onClick={() => void toggle(treasurer)}
                  >
                    {pendingUserId === treasurer.userId ? (
                      <Loader2Icon className="size-4 animate-spin" aria-hidden />
                    ) : treasurer.assigned ? (
                      "Retirar"
                    ) : (
                      "Asignar"
                    )}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
