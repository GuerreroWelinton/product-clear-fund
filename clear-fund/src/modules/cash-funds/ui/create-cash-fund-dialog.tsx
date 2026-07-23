"use client";

import { Loader2Icon, PlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FieldLabel } from "@/components/ui/field-label";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { createCashFundAction } from "@/modules/cash-funds/application/actions";

// Money crosses the module boundary as a decimal string (max 2 decimals);
// mirror the same client-side check the schema enforces server-side so users
// get instant feedback instead of a round trip.
const MONEY_PATTERN = /^\d+(\.\d{1,2})?$/;

export function CreateCashFundDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
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
    const officialStartDate = String(
      form.get("officialStartDate") ?? "",
    ).trim();
    const result = await createCashFundAction({
      name: String(form.get("name") ?? ""),
      phrase: phrase.length > 0 ? phrase : undefined,
      monthlySavingAmount,
      officialStartDate: officialStartDate.length > 0 ? officialStartDate : undefined,
      recommendedDay: Number(form.get("recommendedDay")),
      maximumDay: Number(form.get("maximumDay")),
      maxAdvanceMonths: Number(form.get("maxAdvanceMonths")),
      riskThreshold: Number(form.get("riskThreshold")),
    });

    setLoading(false);
    if (result.ok) {
      toast.success("Caja creada en borrador.");
      setOpen(false);
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
        setOpen(next);
        if (!next) {
          setError(null);
        }
      }}
    >
      <DialogTrigger className={cn(buttonVariants(), "rounded-full")}>
        <PlusIcon className="size-4" aria-hidden />
        Nueva caja
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva caja de ahorro</DialogTitle>
          <DialogDescription>
            La caja se crea en estado borrador. Podés editar su configuración
            antes de activarla.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-2">
            <Label htmlFor="cash-fund-name">Nombre</Label>
            <Input id="cash-fund-name" name="name" required disabled={loading} />
          </div>

          <div className="flex flex-col gap-2">
            <FieldLabel
              htmlFor="cash-fund-phrase"
              hint="Lema o frase corta que identifica a la caja. Es opcional."
            >
              Frase (opcional)
            </FieldLabel>
            <Input id="cash-fund-phrase" name="phrase" disabled={loading} />
          </div>

          <div className="flex flex-col gap-2">
            <FieldLabel
              htmlFor="cash-fund-amount"
              hint="Monto fijo que cada socio aporta por mes. Se vuelve inmutable al activar la caja; para usar otra cuota se crea otra caja."
            >
              Cuota mensual (USD)
            </FieldLabel>
            <Input
              id="cash-fund-amount"
              name="monthlySavingAmount"
              inputMode="decimal"
              placeholder="50.00"
              required
              disabled={loading}
            />
          </div>

          <div className="flex flex-col gap-2">
            <FieldLabel
              htmlFor="cash-fund-start-date"
              hint="Fecha desde la que la caja opera. Si empieza a mitad de mes, ese mes no cuenta para la igualación."
            >
              Fecha de inicio oficial (opcional)
            </FieldLabel>
            <Input
              id="cash-fund-start-date"
              name="officialStartDate"
              type="date"
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <FieldLabel
                htmlFor="cash-fund-recommended-day"
                hint="Día del mes sugerido para pagar. Hasta esta fecha la cuota está en verde."
              >
                Día recomendado
              </FieldLabel>
              <Input
                id="cash-fund-recommended-day"
                name="recommendedDay"
                type="number"
                min={1}
                max={28}
                required
                disabled={loading}
              />
            </div>
            <div className="flex flex-col gap-2">
              <FieldLabel
                htmlFor="cash-fund-maximum-day"
                hint="Fecha límite de pago. Pasado este día la cuota pasa a rojo y se registra un evento de riesgo."
              >
                Día máximo
              </FieldLabel>
              <Input
                id="cash-fund-maximum-day"
                name="maximumDay"
                type="number"
                min={1}
                max={28}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <FieldLabel
                htmlFor="cash-fund-max-advance-months"
                hint="Cuántos meses de ahorro futuro puede adelantar un socio."
              >
                Meses de adelanto máx.
              </FieldLabel>
              <Input
                id="cash-fund-max-advance-months"
                name="maxAdvanceMonths"
                type="number"
                min={0}
                required
                disabled={loading}
              />
            </div>
            <div className="flex flex-col gap-2">
              <FieldLabel
                htmlFor="cash-fund-risk-threshold"
                hint="Cantidad de eventos rojos que marcan a un número como riesgoso."
              >
                Umbral de riesgo
              </FieldLabel>
              <Input
                id="cash-fund-risk-threshold"
                name="riskThreshold"
                type="number"
                min={0}
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
                  Creando…
                </>
              ) : (
                "Crear caja"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
