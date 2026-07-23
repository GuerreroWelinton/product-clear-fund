import { ROLES } from "@/lib/auth";
import { prisma } from "@/lib/db";

import { toAssignmentDto, type TreasurerAssignmentDto } from "../domain/dto";
import { AssignmentError, F03_ERROR_CODES, mapUnexpectedError } from "../domain/errors";
import { resolveAssignAction } from "../domain/rules";
import { assignTreasurerSchema, type AssignTreasurerInput } from "../schemas";
import { requireSuperAdmin } from "./authorize";
import type { RequestContext } from "./context";

// Prisma raises a P2002 known-request error when a unique constraint is
// violated. Detected structurally so this module stays decoupled from the
// generated Prisma error classes.
function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "P2002"
  );
}

// FR-F03-001 / BR-F03-001/002/003: a Super Admin assigns a treasurer to a
// fund. Idempotent (BR-F03-002, ADR-012): a duplicate assignment is a no-op
// and a previously revoked one is reactivated, keeping the same history row.
export async function assignTreasurer(
  input: AssignTreasurerInput,
  ctx: RequestContext,
): Promise<TreasurerAssignmentDto> {
  const parsed = assignTreasurerSchema.safeParse(input);
  if (!parsed.success) {
    throw new AssignmentError(
      F03_ERROR_CODES.INVALID_INPUT,
      "Invalid assignment input",
      { cause: parsed.error },
    );
  }

  await requireSuperAdmin(ctx);

  const { cashFundId, userId } = parsed.data;

  try {
    const fund = await prisma.cashFund.findUnique({
      where: { id: cashFundId },
      select: { id: true },
    });
    if (!fund) {
      throw new AssignmentError(
        F03_ERROR_CODES.CASH_FUND_NOT_FOUND,
        "Cash fund not found",
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });
    if (!user) {
      throw new AssignmentError(
        F03_ERROR_CODES.USER_NOT_FOUND,
        "User not found",
      );
    }
    if (user.role !== ROLES.TREASURER) {
      throw new AssignmentError(
        F03_ERROR_CODES.NOT_A_TREASURER,
        "Only treasurers can be assigned to a cash fund",
      );
    }

    const existing = await prisma.cashFundUser.findUnique({
      where: { cashFundId_userId: { cashFundId, userId } },
    });

    const action = resolveAssignAction(existing);

    if (action === "NOOP") {
      return toAssignmentDto(existing!);
    }
    if (action === "REACTIVATE") {
      const reactivated = await prisma.cashFundUser.update({
        where: { cashFundId_userId: { cashFundId, userId } },
        data: { status: "ACTIVE" },
      });
      return toAssignmentDto(reactivated);
    }

    try {
      const created = await prisma.cashFundUser.create({
        data: { cashFundId, userId, status: "ACTIVE" },
      });
      return toAssignmentDto(created);
    } catch (error) {
      // Concurrent first-time assign: a racing call already inserted the row,
      // so the unique (cashFundId, userId) index rejects this one with P2002.
      // The pair IS now assigned (ACTIVE) — re-read and return it so the call
      // stays idempotent instead of surfacing a spurious failure (ADR-012).
      if (isUniqueViolation(error)) {
        const row = await prisma.cashFundUser.findUnique({
          where: { cashFundId_userId: { cashFundId, userId } },
        });
        if (row) {
          return toAssignmentDto(row);
        }
      }
      throw error;
    }
  } catch (error) {
    throw mapUnexpectedError(error);
  }
}
