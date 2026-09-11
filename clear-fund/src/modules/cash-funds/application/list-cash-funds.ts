import type { RequestContext } from "@/lib/auth";
import { prisma } from "@/lib/db";

import { toCashFundDto, type CashFundDto } from "../domain/dto";
import { mapUnexpectedError } from "../domain/errors";
import { resolveVisibilityForCaller } from "./authorize";

// FR-F02-004 / FR-F03-002: lists the cash funds the caller may see — every
// fund for a Super Admin, only the ACTIVE-assigned ones for a treasurer
// (ARCHITECTURE.md: Prisma must not leak into pages/components — this is the
// read use case those pages were missing). Powers both the /cash-funds table
// and the /audit fund filter; each caller picks the fields it needs from the
// DTO.
export async function listCashFunds(ctx: RequestContext): Promise<CashFundDto[]> {
  const { visibility } = await resolveVisibilityForCaller(ctx);

  try {
    const rows = await prisma.cashFund.findMany({
      where:
        visibility.kind === "ALL"
          ? undefined
          : { id: { in: visibility.cashFundIds } },
      orderBy: { createdAt: "desc" },
    });
    return rows.map(toCashFundDto);
  } catch (error) {
    throw mapUnexpectedError(error);
  }
}
