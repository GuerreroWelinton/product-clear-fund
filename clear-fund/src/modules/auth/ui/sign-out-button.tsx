"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth/client";

export function SignOutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  return (
    <Button
      variant="outline"
      className="rounded-full"
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        await signOut();
        router.push("/login");
      }}
    >
      Cerrar sesión
    </Button>
  );
}
