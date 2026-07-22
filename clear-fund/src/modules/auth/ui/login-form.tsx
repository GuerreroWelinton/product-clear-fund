"use client";

import { Loader2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn } from "@/lib/auth/client";

// Map Better Auth failures to friendly Spanish copy. Never surface internal
// codes or messages to the user.
function friendlyError(code?: string): string {
  switch (code) {
    case "INVALID_EMAIL_OR_PASSWORD":
      return "Correo o contraseña incorrectos.";
    case "USER_BANNED":
    case "BANNED_USER":
      return "Tu cuenta está deshabilitada. Contactá al administrador.";
    default:
      return "No se pudo iniciar sesión. Intentá de nuevo.";
  }
}

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    await signIn.email(
      { email, password },
      {
        onError: (ctx) => {
          const message = friendlyError(ctx.error?.code);
          setError(message);
          toast.error(message);
          setLoading(false);
        },
        onSuccess: () => {
          router.push("/dashboard");
        },
      },
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Correo</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={loading}
          aria-invalid={error ? true : undefined}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Contraseña</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          disabled={loading}
          aria-invalid={error ? true : undefined}
        />
      </div>

      {error ? (
        <p role="alert" aria-live="polite" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <Button
        type="submit"
        disabled={loading}
        className="mt-1 h-11 rounded-full text-base"
      >
        {loading ? (
          <>
            <Loader2Icon className="size-4 animate-spin" aria-hidden />
            Iniciando sesión…
          </>
        ) : (
          "Iniciar sesión"
        )}
      </Button>
    </form>
  );
}
