"use client"

import { InfoIcon } from "lucide-react"

import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface FieldLabelProps {
  htmlFor: string
  children: string
  hint?: string
}

function FieldLabel({ htmlFor, children, hint }: FieldLabelProps) {
  if (!hint) {
    return <Label htmlFor={htmlFor}>{children}</Label>
  }

  // The help affordance opens on click/tap (via Popover), not hover: hover
  // doesn't exist on touch devices. The trigger is a sibling of the Label —
  // never a descendant — since a <label> may not contain interactive content
  // other than its own control. type="button" keeps it from submitting.
  return (
    <div className="flex items-center gap-1.5">
      <Label htmlFor={htmlFor}>{children}</Label>
      <Popover>
        <PopoverTrigger
          type="button"
          aria-label={`Ayuda: ${children}`}
          className="inline-flex items-center justify-center rounded-full text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <InfoIcon className="size-3.5" aria-hidden />
        </PopoverTrigger>
        <PopoverContent>{hint}</PopoverContent>
      </Popover>
    </div>
  )
}

export { FieldLabel }
