"use server";

import { headers } from "next/headers";

import type { CashFundBalanceDto, CashMovementPageDto } from "../domain/dto";
import { F20_ERROR_CODES, LedgerError, type LedgerErrorCode } from "../domain/errors";
import type {
  GetCashFundBalanceInput,
  ListCashMovementsInput,
} from "../schemas";
import { getCashFundBalance, listCashMovements } from ".";

export type GetCashFundBalanceResult =
  | { ok: true; balance: CashFundBalanceDto }
  | { ok: false; code: string; message: string };

export type ListCashMovementsResult =
  | { ok: true; page: CashMovementPageDto }
  | { ok: false; code: string; message: string };

// User-facing Spanish copy per stable F20 code. Internals never surface.
const MESSAGES: Record<LedgerErrorCode, string> = {
  F20_INVALID_INPUT: "Datos inválidos. Revisá los filtros.",
  F20_UNAUTHORIZED: "No tenés permiso para consultar esta caja.",
  F20_CASH_FUND_NOT_FOUND: "No se encontró la caja de ahorro.",
  F20_INSUFFICIENT_BALANCE: "Saldo libre insuficiente para esta operación.",
  F20_OPERATION_FAILED: "No se pudo completar la operación. Intentá de nuevo.",
};

function toFailure(error: unknown): { code: string; message: string } {
  if (error instanceof LedgerError) {
    return { code: error.code, message: MESSAGES[error.code] };
  }
  return {
    code: F20_ERROR_CODES.OPERATION_FAILED,
    message: MESSAGES.F20_OPERATION_FAILED,
  };
}

async function requestContext() {
  return { headers: await headers() };
}

export async function getCashFundBalanceAction(
  input: GetCashFundBalanceInput,
): Promise<GetCashFundBalanceResult> {
  try {
    const balance = await getCashFundBalance(input, await requestContext());
    return { ok: true, balance };
  } catch (error) {
    return { ok: false, ...toFailure(error) };
  }
}

export async function listCashMovementsAction(
  input: ListCashMovementsInput,
): Promise<ListCashMovementsResult> {
  try {
    const page = await listCashMovements(input, await requestContext());
    return { ok: true, page };
  } catch (error) {
    return { ok: false, ...toFailure(error) };
  }
}
