import * as React from "react"

import { cn } from "@/lib/utils"

// A plain native <select>, styled to match the rest of src/components/ui.
// Not built on @base-ui/react/select: that primitive replaces the native
// listbox with a custom popup, which is a behavior change (keyboard nav,
// mobile pickers, native form semantics) — out of scope for a dedup pass.
function Select({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      data-slot="select"
      className={cn(
        "border-input bg-background h-9 w-full rounded-full border px-3 text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Select }
