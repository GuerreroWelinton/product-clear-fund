import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth, ROLES } from "@/lib/auth";

const ROLE_LABELS: Record<string, string> = {
  [ROLES.SUPER_ADMIN]: "Super Admin",
  [ROLES.TREASURER]: "Tesorero",
};

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/login");
  }

  const { user } = session;
  const roleLabel = user.role ? (ROLE_LABELS[user.role] ?? user.role) : "—";

  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-2xl font-medium">Bienvenido, {user.name}</h1>
      <p className="text-muted-foreground text-sm">Rol: {roleLabel}</p>
      <p className="text-muted-foreground mt-4">
        Panel administrativo. Las secciones se irán habilitando con cada
        feature.
      </p>
    </div>
  );
}
