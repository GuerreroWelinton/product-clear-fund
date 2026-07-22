import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { SignOutButton } from "@/modules/auth/ui/sign-out-button";

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/login");
  }

  const { user } = session;

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-3xl flex-col gap-6 p-8">
      <header className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-medium">Bienvenido, {user.name}</h1>
          <p className="text-sm text-muted-foreground">
            Rol: {user.role ?? "—"}
          </p>
        </div>
        <SignOutButton />
      </header>
      <p className="text-muted-foreground">
        Panel administrativo. Las secciones se irán habilitando con cada feature.
      </p>
    </main>
  );
}
