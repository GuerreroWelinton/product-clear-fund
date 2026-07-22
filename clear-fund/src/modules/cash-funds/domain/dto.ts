// Output DTO for a cash fund. Use cases return this instead of raw Prisma
// rows so the module boundary never leaks Prisma's Decimal type or internal
// shape (BR-F02-001). Money is always a decimal STRING, never a number, to
// avoid floating point drift.
export type CashFundStatus = "DRAFT" | "ACTIVE" | "INACTIVE";

export interface CashFundDto {
  id: string;
  name: string;
  logoKey: string | null;
  phrase: string | null;
  currency: string;
  monthlySavingAmount: string;
  officialStartDate: string | null;
  status: CashFundStatus;
  nextMemberNumber: number;
  recommendedDay: number;
  maximumDay: number;
  maxAdvanceMonths: number;
  riskThreshold: number;
  activatedAt: string | null;
  deactivatedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// Structural shape of anything with a Prisma-Decimal-like monthlySavingAmount
// (has `.toString()`), so this module never imports the generated Prisma
// client types directly (domain stays framework-free).
interface CashFundLike {
  id: string;
  name: string;
  logoKey?: string | null;
  phrase?: string | null;
  currency: string;
  monthlySavingAmount: { toString(): string };
  officialStartDate?: Date | string | null;
  status: string;
  nextMemberNumber: number;
  recommendedDay: number;
  maximumDay: number;
  maxAdvanceMonths: number;
  riskThreshold: number;
  activatedAt?: Date | string | null;
  deactivatedAt?: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

function toIso(value: Date | string | null | undefined): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  return new Date(value).toISOString();
}

export function toCashFundDto(row: CashFundLike): CashFundDto {
  return {
    id: row.id,
    name: row.name,
    logoKey: row.logoKey ?? null,
    phrase: row.phrase ?? null,
    currency: row.currency,
    monthlySavingAmount: row.monthlySavingAmount.toString(),
    officialStartDate: toIso(row.officialStartDate),
    status: row.status as CashFundStatus,
    nextMemberNumber: row.nextMemberNumber,
    recommendedDay: row.recommendedDay,
    maximumDay: row.maximumDay,
    maxAdvanceMonths: row.maxAdvanceMonths,
    riskThreshold: row.riskThreshold,
    activatedAt: toIso(row.activatedAt),
    deactivatedAt: toIso(row.deactivatedAt),
    createdAt: new Date(row.createdAt).toISOString(),
    updatedAt: new Date(row.updatedAt).toISOString(),
  };
}
