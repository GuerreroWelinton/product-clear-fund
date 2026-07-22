import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth, ROLES } from "@/lib/auth";

import { AdminNav } from "./_components/admin-nav";

// Server-side guard for every admin route: no session -> back to login.
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-full flex-col">
      <AdminNav
        isSuperAdmin={session.user.role === ROLES.SUPER_ADMIN}
        userName={session.user.name}
      />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        {children}
      </main>
    </div>
  );
}
