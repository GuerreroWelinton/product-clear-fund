// Output DTOs for the treasurer-assignments feature. Use cases return these
// instead of raw Prisma rows so the module boundary never leaks Prisma's
// internal shape.
export type AssignmentStatus = "ACTIVE" | "REVOKED";

export interface TreasurerAssignmentDto {
  id: string;
  cashFundId: string;
  userId: string;
  status: AssignmentStatus;
  createdAt: string;
  updatedAt: string;
}

// A treasurer paired with whether they currently hold an ACTIVE assignment to
// a given fund. Powers the management UI (assign / remove per treasurer).
export interface FundTreasurerDto {
  userId: string;
  name: string;
  email: string;
  assigned: boolean;
}

// Structural shape of a cash_fund_user row (no Prisma types imported here so
// the domain stays framework-free).
interface AssignmentLike {
  id: string;
  cashFundId: string;
  userId: string;
  status: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export function toAssignmentDto(row: AssignmentLike): TreasurerAssignmentDto {
  return {
    id: row.id,
    cashFundId: row.cashFundId,
    userId: row.userId,
    status: row.status as AssignmentStatus,
    createdAt: new Date(row.createdAt).toISOString(),
    updatedAt: new Date(row.updatedAt).toISOString(),
  };
}
