"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { CashFundError, type CashFundErrorCode } from "../domain/errors";
import type {
  ActivateCashFundInput,
  CreateCashFundInput,
  DeactivateCashFundInput,
  UpdateCashFundDraftInput,
  UpdateOperationalConfigInput,
} from "../schemas";
import {
  activateCashFund,
  createCashFund,
  deactivateCashFund,
  updateCashFundDraft,
  updateOperationalConfig,
} from ".";

export type ActionResult =
  | { ok: true }
  | { ok: false; code: string; message: string };

// User-facing Spanish copy per stable F02 code. Internals never surface.
const MESSAGES: Record<CashFundErrorCode, string> = {
  F02_INVALID_INPUT: "Datos inválidos. Revisá el formulario.",
  F02_UNAUTHORIZED: "No tenés permiso para esta acción.",
  F02_CASH_FUND_NOT_FOUND: "No se encontró la caja de ahorro.",
  F02_CASH_FUND_INACTIVE:
    "La caja debe estar activa para editar su configuración operativa.",
  F02_CASH_FUND_FIXED_FEE_LOCKED:
    "La cuota fija solo puede modificarse mientras la caja está en borrador.",
  F02_INVALID_STATE_TRANSITION: "Ese cambio de estado no es válido.",
  F02_INVALID_DAY_CONFIG:
    "Configuración de días inválida: el día recomendado debe ser menor o igual al día máximo (máximo 28).",
  F02_OPERATION_FAILED: "No se pudo completar la operación. Intentá de nuevo.",
};

function toFailure(error: unknown): ActionResult {
  if (error instanceof CashFundError) {
    return { ok: false, code: error.code, message: MESSAGES[error.code] };
  }
  return {
    ok: false,
    code: "F02_OPERATION_FAILED",
    message: MESSAGES.F02_OPERATION_FAILED,
  };
}

async function requestContext() {
  return { headers: await headers() };
}

export async function createCashFundAction(
  input: CreateCashFundInput,
): Promise<ActionResult> {
  try {
    await createCashFund(input, await requestContext());
    revalidatePath("/cash-funds");
    return { ok: true };
  } catch (error) {
    return toFailure(error);
  }
}

export async function updateCashFundDraftAction(
  input: UpdateCashFundDraftInput,
): Promise<ActionResult> {
  try {
    await updateCashFundDraft(input, await requestContext());
    revalidatePath("/cash-funds");
    return { ok: true };
  } catch (error) {
    return toFailure(error);
  }
}

export async function activateCashFundAction(
  input: ActivateCashFundInput,
): Promise<ActionResult> {
  try {
    await activateCashFund(input, await requestContext());
    revalidatePath("/cash-funds");
    return { ok: true };
  } catch (error) {
    return toFailure(error);
  }
}

export async function deactivateCashFundAction(
  input: DeactivateCashFundInput,
): Promise<ActionResult> {
  try {
    await deactivateCashFund(input, await requestContext());
    revalidatePath("/cash-funds");
    return { ok: true };
  } catch (error) {
    return toFailure(error);
  }
}

export async function updateOperationalConfigAction(
  input: UpdateOperationalConfigInput,
): Promise<ActionResult> {
  try {
    await updateOperationalConfig(input, await requestContext());
    revalidatePath("/cash-funds");
    return { ok: true };
  } catch (error) {
    return toFailure(error);
  }
}
