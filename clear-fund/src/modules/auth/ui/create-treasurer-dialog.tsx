"use client";

import { Loader2Icon, UserPlusIcon } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { createTreasurerAction } from "@/modules/auth/application/actions";

export function CreateTreasurerDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const form = new FormData(event.currentTarget);
    const result = await createTreasurerAction({
      email: String(form.get("email") ?? ""),
      name: String(form.get("name") ?? ""),
      password: String(form.get("password") ?? ""),
    });

    setLoading(false);
    if (result.ok) {
      toast.success("Tesorero creado.");
      setOpen(false);
      router.refresh();
    } else {
      setError(result.message);
      toast.error(result.message);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className={cn(buttonVariants(), "rounded-full")}>
        <UserPlusIcon className="size-4" aria-hidden />
        Crear tesorero
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Crear tesorero</DialogTitle>
          <DialogDescription>
            La cuenta se crea con rol de tesorero. El tesorero podrá iniciar
            sesión con estas credenciales.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-2">
            <Label htmlFor="treasurer-name">Nombre</Label>
            <Input id="treasurer-name" name="name" required disabled={loading} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="treasurer-email">Correo</Label>
            <Input
              id="treasurer-email"
              name="email"
              type="email"
              autoComplete="off"
              required
              disabled={loading}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="treasurer-password">Contraseña</Label>
            <Input
              id="treasurer-password"
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              disabled={loading}
            />
            <p className="text-muted-foreground text-xs">Mínimo 8 caracteres.</p>
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
                "Crear tesorero"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
