import { z } from "zod";

// Page size is capped so a caller cannot ask for the whole log in one request;
// the audit trail is append-only and grows without bound.
export const AUDIT_PAGE_SIZE_MAX = 100;
export const AUDIT_PAGE_SIZE_DEFAULT = 25;

// FR-F23-001 / FR-F23-002: the global log, or one fund's log. `cashFundId`
// absent means "everything the caller may see"; a Super Admin gets global
// events too, a treasurer only their assigned funds (resolveAuditScope).
export const listAuditEventsSchema = z.object({
  cashFundId: z.string().min(1).optional(),
  // Filters are optional and additive.
  action: z.string().min(1).optional(),
  entityType: z.string().min(1).optional(),
  entityId: z.string().min(1).optional(),
  actorId: z.string().min(1).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(AUDIT_PAGE_SIZE_MAX)
    .default(AUDIT_PAGE_SIZE_DEFAULT),
});
export type ListAuditEventsInput = z.input<typeof listAuditEventsSchema>;
export type ListAuditEventsQuery = z.output<typeof listAuditEventsSchema>;

// FR-F23-003: the detail view, where previous and new values are compared.
export const getAuditEventSchema = z.object({
  id: z.string().min(1),
});
export type GetAuditEventInput = z.infer<typeof getAuditEventSchema>;
