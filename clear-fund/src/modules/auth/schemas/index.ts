import { z } from "zod";

// Better Auth's default minimum password length is 8 characters.
const password = z.string().min(8).max(128);

export const createTreasurerSchema = z.object({
  email: z.email(),
  name: z.string().min(1).max(120),
  password,
});
export type CreateTreasurerInput = z.infer<typeof createTreasurerSchema>;

export const disableUserSchema = z.object({
  userId: z.string().min(1),
  banReason: z.string().min(1).max(500).optional(),
});
export type DisableUserInput = z.infer<typeof disableUserSchema>;

export const enableUserSchema = z.object({
  userId: z.string().min(1),
});
export type EnableUserInput = z.infer<typeof enableUserSchema>;

export const revokeUserSessionsSchema = z.object({
  userId: z.string().min(1),
});
export type RevokeUserSessionsInput = z.infer<typeof revokeUserSessionsSchema>;
