import { z } from "zod";

// A treasurer assignment is identified by the (cashFundId, userId) pair; both
// are opaque ids validated as non-empty strings at the module boundary.
export const assignTreasurerSchema = z.object({
  cashFundId: z.string().min(1),
  userId: z.string().min(1),
});
export type AssignTreasurerInput = z.infer<typeof assignTreasurerSchema>;

export const unassignTreasurerSchema = z.object({
  cashFundId: z.string().min(1),
  userId: z.string().min(1),
});
export type UnassignTreasurerInput = z.infer<typeof unassignTreasurerSchema>;

export const listFundAssignmentsSchema = z.object({
  cashFundId: z.string().min(1),
});
export type ListFundAssignmentsInput = z.infer<
  typeof listFundAssignmentsSchema
>;
