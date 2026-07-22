import { z } from "zod";

// Money crosses the module boundary as a decimal string (max 2 decimals) to
// avoid floating point drift; domain rules re-validate it is strictly > 0.
const moneyString = z
  .string()
  .regex(/^\d+(\.\d{1,2})?$/, "Invalid amount");

// Structural/operational config values are whole days/months/counts.
const dayOrCount = z.number().int();

// ISO calendar date (YYYY-MM-DD); parsed to a Date at the Prisma boundary.
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date");

export const createCashFundSchema = z.object({
  name: z.string().min(1).max(120),
  logoKey: z.string().min(1).max(500).optional(),
  phrase: z.string().min(1).max(500).optional(),
  monthlySavingAmount: moneyString,
  officialStartDate: isoDate.optional(),
  recommendedDay: dayOrCount,
  maximumDay: dayOrCount,
  maxAdvanceMonths: dayOrCount,
  riskThreshold: dayOrCount,
});
export type CreateCashFundInput = z.infer<typeof createCashFundSchema>;

// All fields but cashFundId are optional. While a fund is DRAFT everything is
// editable (nothing locks until activation, BR-F02-002/005): structural fields
// (name/phrase/logoKey/monthlySavingAmount/officialStartDate) and the full
// operational config (recommendedDay/maximumDay/maxAdvanceMonths/riskThreshold).
export const updateCashFundDraftSchema = z.object({
  cashFundId: z.string().min(1),
  name: z.string().min(1).max(120).optional(),
  logoKey: z.string().min(1).max(500).nullable().optional(),
  phrase: z.string().min(1).max(500).nullable().optional(),
  monthlySavingAmount: moneyString.optional(),
  officialStartDate: isoDate.nullable().optional(),
  recommendedDay: dayOrCount.optional(),
  maximumDay: dayOrCount.optional(),
  maxAdvanceMonths: dayOrCount.optional(),
  riskThreshold: dayOrCount.optional(),
});
export type UpdateCashFundDraftInput = z.infer<
  typeof updateCashFundDraftSchema
>;

export const activateCashFundSchema = z.object({
  cashFundId: z.string().min(1),
});
export type ActivateCashFundInput = z.infer<typeof activateCashFundSchema>;

export const deactivateCashFundSchema = z.object({
  cashFundId: z.string().min(1),
});
export type DeactivateCashFundInput = z.infer<
  typeof deactivateCashFundSchema
>;

// Operational config only: recommendedDay/maximumDay/maxAdvanceMonths/
// riskThreshold. Never the fixed fee (monthlySavingAmount).
export const updateOperationalConfigSchema = z.object({
  cashFundId: z.string().min(1),
  recommendedDay: dayOrCount.optional(),
  maximumDay: dayOrCount.optional(),
  maxAdvanceMonths: dayOrCount.optional(),
  riskThreshold: dayOrCount.optional(),
});
export type UpdateOperationalConfigInput = z.infer<
  typeof updateOperationalConfigSchema
>;
