"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { AuthError, type AuthErrorCode } from "../domain/errors";
import {
  createTreasurer,
  disableUser,
  enableUser,
  revokeUserSessions,
} from ".";

export type ActionResult =
  | { ok: true }
  | { ok: false; code: string; message: string };

// User-facing Spanish copy per stable F01 code. Internals never surface.
const MESSAGES: Record<AuthErrorCode, string> = {
  F01_INVALID_INPUT: "Datos inválidos. Revisá el formulario.",
  F01_UNAUTHORIZED: "No tenés permiso para esta acción.",
  F01_EMAIL_TAKEN: "Ya existe una cuenta con ese correo.",
  F01_USER_NOT_FOUND: "No se encontró el usuario.",
  F01_CANNOT_MODIFY_SELF: "No podés modificar tu propia cuenta.",
  F01_OPERATION_FAILED: "No se pudo completar la operación. Intentá de nuevo.",
};

function toFailure(error: unknown): ActionResult {
  if (error instanceof AuthError) {
    return { ok: false, code: error.code, message: MESSAGES[error.code] };
  }
  return {
    ok: false,
    code: "F01_OPERATION_FAILED",
    message: MESSAGES.F01_OPERATION_FAILED,
  };
}

async function requestContext() {
  return { headers: await headers() };
}

export async function createTreasurerAction(input: {
  email: string;
  name: string;
  password: string;
}): Promise<ActionResult> {
  try {
    await createTreasurer(input, await requestContext());
    revalidatePath("/users");
    return { ok: true };
  } catch (error) {
    return toFailure(error);
  }
}

export async function disableUserAction(input: {
  userId: string;
  banReason?: string;
}): Promise<ActionResult> {
  try {
    await disableUser(input, await requestContext());
    revalidatePath("/users");
    return { ok: true };
  } catch (error) {
    return toFailure(error);
  }
}

export async function enableUserAction(input: {
  userId: string;
}): Promise<ActionResult> {
  try {
    await enableUser(input, await requestContext());
    revalidatePath("/users");
    return { ok: true };
  } catch (error) {
    return toFailure(error);
  }
}

export async function revokeUserSessionsAction(input: {
  userId: string;
}): Promise<ActionResult> {
  try {
    await revokeUserSessions(input, await requestContext());
    revalidatePath("/users");
    return { ok: true };
  } catch (error) {
    return toFailure(error);
  }
}
