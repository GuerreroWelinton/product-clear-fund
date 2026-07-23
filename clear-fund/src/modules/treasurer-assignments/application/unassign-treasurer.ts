import { prisma } from "@/lib/db";

import { toAssignmentDto, type TreasurerAssignmentDto } from "../domain/dto";
import { AssignmentError, F03_ERROR_CODES, mapUnexpectedError } from "../domain/errors";
import { resolveUnassignAction } from "../domain/rules";
import { unassignTreasurerSchema, type UnassignTreasurerInput } from "../schemas";
import { requireSuperAdmin } from "./authorize";
import type { RequestContext } from "./context";

// FR-F03-003 / BR-F03-004: a Super Admin withdraws an assignment. This is a
// soft-delete — the row is flipped to REVOKED, never deleted — so historical
// operations keep referencing the treasurer (ADR-012). Idempotent: revoking a
// missing or already-revoked assignment is a no-op.
export async function unassignTreasurer(
  input: UnassignTreasurerInput,
  ctx: RequestContext,
): Promise<TreasurerAssignmentDto> {
  const parsed = unassignTreasurerSchema.safeParse(input);
  if (!parsed.success) {
    throw new AssignmentError(
      F03_ERROR_CODES.INVALID_INPUT,
      "Invalid unassignment input",
      { cause: parsed.error },
    );
  }

  await requireSuperAdmin(ctx);

  const { cashFundId, userId } = parsed.data;

  try {
    const existing = await prisma.cashFundUser.findUnique({
      where: { cashFundId_userId: { cashFundId, userId } },
    });

    if (!existing) {
      throw new AssignmentError(
        F03_ERROR_CODES.ASSIGNMENT_NOT_FOUND,
        "Assignment not found",
      );
    }

    const action = resolveUnassignAction(existing);
    if (action === "NOOP") {
      return toAssignmentDto(existing);
    }

    const revoked = await prisma.cashFundUser.update({
      where: { cashFundId_userId: { cashFundId, userId } },
      data: { status: "REVOKED" },
    });
    return toAssignmentDto(revoked);
  } catch (error) {
    throw mapUnexpectedError(error);
  }
}
