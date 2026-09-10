"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import type { ActionResult } from "@/lib/actions";

// Shared by row-action menus (user-row-actions.tsx / cash-fund-row-actions.tsx):
// runs a server action inside a transition, then either refreshes the route
// and shows a success toast, or surfaces the action's own error message.
export function useActionRunner() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<ActionResult>, successText: string) {
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        toast.success(successText);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  return { pending, run };
}
