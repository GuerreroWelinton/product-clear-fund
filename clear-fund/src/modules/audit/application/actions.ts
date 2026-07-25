"use server";

import { headers } from "next/headers";

import type { AuditEventDto, AuditEventPageDto } from "../domain/dto";
import { AuditError, type AuditErrorCode } from "../domain/errors";
import type { GetAuditEventInput, ListAuditEventsInput } from "../schemas";
import { getAuditEvent, listAuditEvents } from ".";

export type ListAuditEventsResult =
  | { ok: true; page: AuditEventPageDto }
  | { ok: false; code: string; message: string };

export type GetAuditEventResult =
  | { ok: true; event: AuditEventDto }
  | { ok: false; code: string; message: string };

// User-facing Spanish copy per stable F23 code. Internals never surface.
const MESSAGES: Record<AuditErrorCode, string> = {
  F23_INVALID_INPUT: "Datos inválidos. Revisá los filtros.",
  F23_UNAUTHORIZED: "No tenés permiso para consultar la auditoría.",
  F23_FORBIDDEN_CASH_FUND: "No tenés acceso a la auditoría de esa caja.",
  F23_EVENT_NOT_FOUND: "No se encontró el evento de auditoría.",
  F23_OPERATION_FAILED: "No se pudo completar la operación. Intentá de nuevo.",
};

function messageFor(error: unknown): { code: string; message: string } {
  if (error instanceof AuditError) {
    return { code: error.code, message: MESSAGES[error.code] };
  }
  return {
    code: "F23_OPERATION_FAILED",
    message: MESSAGES.F23_OPERATION_FAILED,
  };
}

async function requestContext() {
  return { headers: await headers() };
}

export async function listAuditEventsAction(
  input: ListAuditEventsInput,
): Promise<ListAuditEventsResult> {
  try {
    const page = await listAuditEvents(input, await requestContext());
    return { ok: true, page };
  } catch (error) {
    return { ok: false, ...messageFor(error) };
  }
}

export async function getAuditEventAction(
  input: GetAuditEventInput,
): Promise<GetAuditEventResult> {
  try {
    const event = await getAuditEvent(input, await requestContext());
    return { ok: true, event };
  } catch (error) {
    return { ok: false, ...messageFor(error) };
  }
}
