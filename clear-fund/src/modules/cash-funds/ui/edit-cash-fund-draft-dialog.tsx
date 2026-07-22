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
import { Label } from "@/components/ui/label";
import { updateCashFundDraftAction } from "@/modules/cash-funds/application/actions";
import type { CashFundDto } from "@/modules/cash-funds/domain/dto";

interface EditCashFundDraftDialogProps {
  fund: CashFundDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MONEY_PATTERN = /^\d+(\.\d{1,2})?$/;

function toDateInputValue(isoDate: string | null): string {
  if (!isoDate) {
    return "";
  }
  return isoDate.slice(0, 10);
}

export function EditCashFundDraftDialog({
  fund,
  open,
  onOpenChange,
}: EditCashFundDraftDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const form = new FormData(event.currentTarget);
    const monthlySavingAmount = String(
      form.get("monthlySavingAmount") ?? "",
    ).trim();

    if (!MONEY_PATTERN.test(monthlySavingAmount)) {
      const message = "El monto debe ser un número válido (máx. 2 decimales).";
      setError(message);
      toast.error(message);
      return;
    }

    setLoading(true);
    const phrase = String(form.get("phrase") ?? "").trim();
    const officialStartDate = String(form.get("officialStartDate") ?? "").trim();

    const result = await updateCashFundDraftAction({
      cashFundId: fund.id,
      name: String(form.get("name") ?? ""),
      phrase: phrase.length > 0 ? phrase : null,
      monthlySavingAmount,
      officialStartDate: officialStartDate.length > 0 ? officialStartDate : null,
      recommendedDay: Number(form.get("recommendedDay")),
      maximumDay: Number(form.get("maximumDay")),
      maxAdvanceMonths: Number(form.get("maxAdvanceMonths")),
      riskThreshold: Number(form.get("riskThreshold")),
    });

    setLoading(false);
    if (result.ok) {
      toast.success("Borrador actualizado.");
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
          <DialogTitle>Editar borrador</DialogTitle>
          <DialogDescription>
            Estos campos solo pueden editarse mientras la caja está en
            borrador.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-2">
            <Label htmlFor="edit-cash-fund-name">Nombre</Label>
            <Input
              id="edit-cash-fund-name"
              name="name"
              defaultValue={fund.name}
              required
              disabled={loading}
            />
          </div>

          <div className="flex flex-col gap-2">
            <FieldLabel
              htmlFor="edit-cash-fund-phrase"
              hint="Lema o frase corta que identifica a la caja. Es opcional."
            >
              Frase (opcional)
            </FieldLabel>
            <Input
              id="edit-cash-fund-phrase"
              name="phrase"
              defaultValue={fund.phrase ?? ""}
              disabled={loading}
            />
          </div>

          <div className="flex flex-col gap-2">
            <FieldLabel
              htmlFor="edit-cash-fund-amount"
              hint="Monto fijo que cada socio aporta por mes. Se vuelve inmutable al activar la caja; para usar otra cuota se crea otra caja."
            >
              Cuota mensual (USD)
            </FieldLabel>
            <Input
              id="edit-cash-fund-amount"
              name="monthlySavingAmount"
              inputMode="decimal"
              defaultValue={fund.monthlySavingAmount}
              required
              disabled={loading}
            />
          </div>

          <div className="flex flex-col gap-2">
            <FieldLabel
              htmlFor="edit-cash-fund-start-date"
              hint="Fecha desde la que la caja opera. Si empieza a mitad de mes, ese mes no cuenta para la igualación."
            >
              Fecha de inicio oficial (opcional)
            </FieldLabel>
            <Input
              id="edit-cash-fund-start-date"
              name="officialStartDate"
              type="date"
              defaultValue={toDateInputValue(fund.officialStartDate)}
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <FieldLabel
                htmlFor="edit-cash-fund-recommended-day"
                hint="Día del mes sugerido para pagar la cuota y evitar mora."
              >
                Día recomendado
              </FieldLabel>
              <Input
                id="edit-cash-fund-recommended-day"
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
                htmlFor="edit-cash-fund-maximum-day"
                hint="Último día del mes para pagar antes de que se registre un evento de riesgo."
              >
                Día máximo
              </FieldLabel>
              <Input
                id="edit-cash-fund-maximum-day"
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
                htmlFor="edit-cash-fund-max-advance-months"
                hint="Cuántos meses de ahorro futuro puede adelantar un socio."
              >
                Meses de adelanto máx.
              </FieldLabel>
              <Input
                id="edit-cash-fund-max-advance-months"
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
                htmlFor="edit-cash-fund-risk-threshold"
                hint="Cantidad de eventos rojos que marcan a un número como riesgoso."
              >
                Umbral de riesgo
              </FieldLabel>
              <Input
                id="edit-cash-fund-risk-threshold"
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
