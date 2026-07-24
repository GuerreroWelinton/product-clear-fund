"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

import { AuditEventDetailDialog } from "./audit-event-detail-dialog";

// The one interactive island per row: opens the detail dialog. Kept separate so
// the log table itself stays a server component.
export function AuditEventRowActions({ eventId }: { eventId: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="rounded-full"
        onClick={() => setOpen(true)}
      >
        Ver detalle
      </Button>
      <AuditEventDetailDialog
        eventId={eventId}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
