"use client";

import { Loader2Icon } from "lucide-react";
import { useEffect, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getAuditEventAction } from "@/modules/audit/application/actions";
import type { AuditEventDto } from "@/modules/audit/domain/dto";
import {
  auditActionLabel,
  auditEntityLabel,
  formatAuditValue,
} from "@/modules/audit/domain/event-types";

interface AuditEventDetailDialogProps {
  eventId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const dateTimeFormatter = new Intl.DateTimeFormat("es-EC", {
  dateStyle: "medium",
  timeStyle: "medium",
  // Business timezone (TECHNICAL_CONVENTIONS.md); timestamps are stored in UTC.
  timeZone: "America/Guayaquil",
});

// FR-F23-003: the detail view where previous and new values are compared.
//
// The event is re-fetched by id through the use case rather than passed down from
// the already-rendered row: that keeps the server-side authorization check on the
// path that actually serves the detail, and gives the dialog real loading and
// error states.
export function AuditEventDetailDialog({
  eventId,
  open,
  onOpenChange,
}: AuditEventDetailDialogProps) {
  const [event, setEvent] = useState<AuditEventDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    let active = true;
    // Async IIFE so the state updates land AFTER the await, not synchronously in
    // the effect body (react-hooks/set-state-in-effect).
    void (async () => {
      const result = await getAuditEventAction({ id: eventId });
      if (!active) {
        return;
      }
      if (result.ok) {
        setEvent(result.event);
        setError(null);
      } else {
        setError(result.message);
        setEvent(null);
      }
    })();
    return () => {
      active = false;
    };
  }, [open, eventId]);

  const isLoading = event === null && error === null;
  const changeEntries = event?.changes ? Object.entries(event.changes) : [];

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) {
          setEvent(null);
          setError(null);
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Detalle del evento</DialogTitle>
          <DialogDescription>
            Registro inmutable: no puede editarse ni eliminarse.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="text-muted-foreground flex items-center gap-2 py-8 text-sm">
            <Loader2Icon className="size-4 animate-spin" aria-hidden />
            Cargando evento…
          </div>
        ) : error ? (
          <p role="alert" className="text-destructive py-8 text-sm">
            {error}
          </p>
        ) : event ? (
          <div className="flex flex-col gap-4">
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
              <dt className="text-muted-foreground">Acción</dt>
              <dd className="font-medium">{auditActionLabel(event.action)}</dd>

              <dt className="text-muted-foreground">Fecha</dt>
              <dd>{dateTimeFormatter.format(new Date(event.occurredAt))}</dd>

              <dt className="text-muted-foreground">Actor</dt>
              <dd className="break-all">{event.actorEmail ?? "Sistema"}</dd>

              <dt className="text-muted-foreground">Entidad</dt>
              <dd>
                {auditEntityLabel(event.entityType)}
                <span className="text-muted-foreground block text-xs break-all">
                  {event.entityId}
                </span>
              </dd>

              {event.reason ? (
                <>
                  <dt className="text-muted-foreground">Motivo</dt>
                  <dd>{event.reason}</dd>
                </>
              ) : null}

              {event.relatedEventId ? (
                <>
                  <dt className="text-muted-foreground">Operación original</dt>
                  <dd className="text-xs break-all">{event.relatedEventId}</dd>
                </>
              ) : null}
            </dl>

            <div>
              <h3 className="mb-2 text-sm font-medium">Cambios</h3>
              {changeEntries.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  Este evento no registra cambios de campos.
                </p>
              ) : (
                <div className="overflow-x-auto rounded-xl border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium">
                          Campo
                        </th>
                        <th className="px-3 py-2 text-left font-medium">
                          Antes
                        </th>
                        <th className="px-3 py-2 text-left font-medium">
                          Después
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {changeEntries.map(([field, change]) => (
                        <tr key={field} className="border-t">
                          <th
                            scope="row"
                            className="px-3 py-2 text-left font-normal"
                          >
                            {field}
                          </th>
                          <td className="text-muted-foreground px-3 py-2 break-all">
                            {formatAuditValue(field, change.previous)}
                          </td>
                          <td className="px-3 py-2 font-medium break-all">
                            {formatAuditValue(field, change.next)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
