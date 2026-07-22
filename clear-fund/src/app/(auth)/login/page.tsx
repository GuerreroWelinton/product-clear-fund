import { headers } from "next/headers";
import { redirect } from "next/navigation";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { LoginForm } from "@/modules/auth/ui/login-form";

export default async function LoginPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md rounded-3xl">
        <CardHeader className="items-center gap-2 pt-8 text-center">
          <CardTitle className="text-2xl">Clear Fund</CardTitle>
          <CardDescription>Iniciá sesión para continuar</CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-8">
          <LoginForm />
        </CardContent>
      </Card>
    </main>
  );
}
