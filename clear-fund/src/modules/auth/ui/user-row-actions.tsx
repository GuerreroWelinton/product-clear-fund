"use client";

import { MoreHorizontalIcon } from "lucide-react";
import { useState } from "react";

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
import { useActionRunner } from "@/hooks/use-action-runner";
import { cn } from "@/lib/utils";
import {
  disableUserAction,
  enableUserAction,
  revokeUserSessionsAction,
} from "@/modules/auth/application/actions";

interface UserRowActionsProps {
  userId: string;
  userName: string;
  banned: boolean;
  isSelf: boolean;
}

export function UserRowActions({
  userId,
  userName,
  banned,
  isSelf,
}: UserRowActionsProps) {
  const { pending, run } = useActionRunner();
  const [confirmDisable, setConfirmDisable] = useState(false);

  // A Super Admin cannot act destructively on their own account.
  if (isSelf) {
    return <span className="text-muted-foreground text-xs">—</span>;
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          disabled={pending}
          aria-label={`Acciones para ${userName}`}
          className={cn(
            buttonVariants({ variant: "ghost", size: "icon" }),
            "rounded-full",
          )}
        >
          <MoreHorizontalIcon className="size-4" aria-hidden />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {banned ? (
            <DropdownMenuItem
              onClick={() =>
                run(() => enableUserAction({ userId }), "Cuenta habilitada.")
              }
            >
              Habilitar
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              variant="destructive"
              onClick={() => setConfirmDisable(true)}
            >
              Deshabilitar
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            onClick={() =>
              run(
                () => revokeUserSessionsAction({ userId }),
                "Sesiones revocadas.",
              )
            }
          >
            Revocar sesiones
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmDisable} onOpenChange={setConfirmDisable}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deshabilitar a {userName}</AlertDialogTitle>
            <AlertDialogDescription>
              La cuenta no podrá iniciar sesión y sus sesiones activas se
              revocarán. Podés volver a habilitarla más tarde.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-full"
              onClick={() => {
                setConfirmDisable(false);
                run(
                  () => disableUserAction({ userId }),
                  "Cuenta deshabilitada.",
                );
              }}
            >
              Deshabilitar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
