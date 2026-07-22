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
import { CreateTreasurerDialog } from "@/modules/auth/ui/create-treasurer-dialog";
import { UserRowActions } from "@/modules/auth/ui/user-row-actions";

const ROLE_LABELS: Record<string, string> = {
  [ROLES.SUPER_ADMIN]: "Super Admin",
  [ROLES.TREASURER]: "Tesorero",
};

export default async function UsersPage() {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });

  // The (admin) layout already ensures a session exists; user management is
  // restricted further to the Super Admin.
  if (session?.user.role !== ROLES.SUPER_ADMIN) {
    redirect("/dashboard");
  }

  const { users } = await auth.api.listUsers({
    query: { limit: 200, sortBy: "createdAt", sortDirection: "desc" },
    headers: requestHeaders,
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium">Usuarios</h1>
          <p className="text-muted-foreground text-sm">
            Administrá las cuentas de tesorero.
          </p>
        </div>
        <CreateTreasurerDialog />
      </div>

      <div className="bg-card rounded-2xl border p-2">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Correo</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-muted-foreground py-8 text-center"
                >
                  No hay usuarios todavía.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => {
                const banned = Boolean(user.banned);
                return (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      {user.role ? (ROLE_LABELS[user.role] ?? user.role) : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={banned ? "destructive" : "secondary"}>
                        {banned ? "Deshabilitado" : "Activo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <UserRowActions
                        userId={user.id}
                        userName={user.name}
                        banned={banned}
                        isSelf={user.id === session.user.id}
                      />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
