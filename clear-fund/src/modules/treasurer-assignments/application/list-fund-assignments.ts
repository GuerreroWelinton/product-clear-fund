import { ROLES } from "@/lib/auth";
import { prisma } from "@/lib/db";

import type { FundTreasurerDto } from "../domain/dto";
import { AssignmentError, F03_ERROR_CODES, mapUnexpectedError } from "../domain/errors";
import {
  listFundAssignmentsSchema,
  type ListFundAssignmentsInput,
} from "../schemas";
import { requireSuperAdmin } from "./authorize";
import type { RequestContext } from "./context";

// Powers the management UI: every treasurer paired with whether they currently
// hold an ACTIVE assignment to the given fund. Super Admin only (BR-F03-001).
export async function listFundAssignments(
  input: ListFundAssignmentsInput,
  ctx: RequestContext,
): Promise<FundTreasurerDto[]> {
  const parsed = listFundAssignmentsSchema.safeParse(input);
  if (!parsed.success) {
    throw new AssignmentError(
      F03_ERROR_CODES.INVALID_INPUT,
      "Invalid input",
      { cause: parsed.error },
    );
  }

  await requireSuperAdmin(ctx);

  const { cashFundId } = parsed.data;

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

    const [treasurers, activeAssignments] = await Promise.all([
      prisma.user.findMany({
        where: { role: ROLES.TREASURER },
        select: { id: true, name: true, email: true },
        orderBy: { name: "asc" },
      }),
      prisma.cashFundUser.findMany({
        where: { cashFundId, status: "ACTIVE" },
        select: { userId: true },
      }),
    ]);

    const assignedIds = new Set(activeAssignments.map((a) => a.userId));

    return treasurers.map((treasurer) => ({
      userId: treasurer.id,
      name: treasurer.name,
      email: treasurer.email,
      assigned: assignedIds.has(treasurer.id),
    }));
  } catch (error) {
    throw mapUnexpectedError(error);
  }
}
