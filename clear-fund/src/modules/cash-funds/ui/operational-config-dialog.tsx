"use client";

import { Loader2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FieldLabel } from "@/components/ui/field-label";
import { Input } from "@/components/ui/input";
import { updateOperationalConfigAction } from "@/modules/cash-funds/application/actions";
import type { CashFundDto } from "@/modules/cash-funds/domain/dto";

interface OperationalConfigDialogProps {
  fund: CashFundDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OperationalConfigDialog({
  fund,
  open,
  onOpenChange,
}: OperationalConfigDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const form = new FormData(event.currentTarget);
    const result = await updateOperationalConfigAction({
      cashFundId: fund.id,
      recommendedDay: Number(form.get("recommendedDay")),
      maximumDay: Number(form.get("maximumDay")),
      maxAdvanceMonths: Number(form.get("maxAdvanceMonths")),
      riskThreshold: Number(form.get("riskThreshold")),
    });

    setLoading(false);
    if (result.ok) {
      toast.success("Configuración operativa actualizada.");
      onOpenChange(false);
      router.refresh();
    } else {
      setError(result.message);
      toast.error(result.message);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) {
          setError(null);
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Configuración operativa</DialogTitle>
          <DialogDescription>
            Estos valores pueden editarse mientras la caja está activa. La
            cuota fija no se modifica acá.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <FieldLabel
                htmlFor="config-recommended-day"
                hint="Día del mes sugerido para pagar la cuota y evitar mora."
              >
                Día recomendado
              </FieldLabel>
              <Input
                id="config-recommended-day"
                name="recommendedDay"
                type="number"
                min={1}
                max={28}
                defaultValue={fund.recommendedDay}
                required
                disabled={loading}
              />
            </div>
            <div className="flex flex-col gap-2">
              <FieldLabel
                htmlFor="config-maximum-day"
                hint="Último día del mes para pagar antes de que se registre un evento de riesgo."
              >
                Día máximo
              </FieldLabel>
              <Input
                id="config-maximum-day"
                name="maximumDay"
                type="number"
                min={1}
                max={28}
                defaultValue={fund.maximumDay}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <FieldLabel
                htmlFor="config-max-advance-months"
                hint="Cuántos meses de ahorro futuro puede adelantar un socio."
              >
                Meses de adelanto máx.
              </FieldLabel>
              <Input
                id="config-max-advance-months"
                name="maxAdvanceMonths"
                type="number"
                min={0}
                defaultValue={fund.maxAdvanceMonths}
                required
                disabled={loading}
              />
            </div>
            <div className="flex flex-col gap-2">
              <FieldLabel
                htmlFor="config-risk-threshold"
                hint="Cantidad de eventos rojos que marcan a un número como riesgoso."
              >
                Umbral de riesgo
              </FieldLabel>
              <Input
                id="config-risk-threshold"
                name="riskThreshold"
                type="number"
                min={0}
                defaultValue={fund.riskThreshold}
                required
                disabled={loading}
              />
            </div>
          </div>

          {error ? (
            <p role="alert" className="text-destructive text-sm">
              {error}
            </p>
          ) : null}

          <DialogFooter>
            <Button type="submit" disabled={loading} className="rounded-full">
              {loading ? (
                <>
                  <Loader2Icon className="size-4 animate-spin" aria-hidden />
                  Guardando…
                </>
              ) : (
                "Guardar cambios"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
