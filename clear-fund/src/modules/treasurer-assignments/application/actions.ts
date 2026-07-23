"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import type { FundTreasurerDto } from "../domain/dto";
import { AssignmentError, type AssignmentErrorCode } from "../domain/errors";
import type {
  AssignTreasurerInput,
  ListFundAssignmentsInput,
  UnassignTreasurerInput,
} from "../schemas";
import {
  assignTreasurer,
  listFundAssignments,
  unassignTreasurer,
} from ".";

export type ActionResult =
  | { ok: true }
  | { ok: false; code: string; message: string };

export type ListResult =
  | { ok: true; treasurers: FundTreasurerDto[] }
  | { ok: false; code: string; message: string };

// User-facing Spanish copy per stable F03 code. Internals never surface.
const MESSAGES: Record<AssignmentErrorCode, string> = {
  F03_INVALID_INPUT: "Datos inválidos. Revisá la selección.",
  F03_UNAUTHORIZED: "No tenés permiso para esta acción.",
  F03_CASH_FUND_NOT_FOUND: "No se encontró la caja de ahorro.",
  F03_USER_NOT_FOUND: "No se encontró el usuario.",
  F03_NOT_A_TREASURER: "Solo se pueden asignar cuentas de tesorero.",
  F03_ASSIGNMENT_NOT_FOUND: "No existe una asignación para ese tesorero.",
  F03_OPERATION_FAILED: "No se pudo completar la operación. Intentá de nuevo.",
};

function messageFor(error: unknown): { code: string; message: string } {
  if (error instanceof AssignmentError) {
    return { code: error.code, message: MESSAGES[error.code] };
  }
  return {
    code: "F03_OPERATION_FAILED",
    message: MESSAGES.F03_OPERATION_FAILED,
  };
}

async function requestContext() {
  return { headers: await headers() };
}

export async function assignTreasurerAction(
  input: AssignTreasurerInput,
): Promise<ActionResult> {
  try {
    await assignTreasurer(input, await requestContext());
    revalidatePath("/cash-funds");
    return { ok: true };
  } catch (error) {
    return { ok: false, ...messageFor(error) };
  }
}

export async function unassignTreasurerAction(
  input: UnassignTreasurerInput,
): Promise<ActionResult> {
  try {
    await unassignTreasurer(input, await requestContext());
    revalidatePath("/cash-funds");
    return { ok: true };
  } catch (error) {
    return { ok: false, ...messageFor(error) };
  }
}

export async function listFundAssignmentsAction(
  input: ListFundAssignmentsInput,
): Promise<ListResult> {
  try {
    const treasurers = await listFundAssignments(input, await requestContext());
    return { ok: true, treasurers };
  } catch (error) {
    return { ok: false, ...messageFor(error) };
  }
}
