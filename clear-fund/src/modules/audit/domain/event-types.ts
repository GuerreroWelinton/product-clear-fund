// Audit event vocabulary (F23). Names come from EVENT_CATALOG.md, which the
// spec declares as "sugeridos"; only the ones backed by a real, already
// implemented write are declared here. Future features add their own types —
// the physical column is TEXT, so no migration is needed (ADR-013).

// What an event is about. Pairs with entityId to identify the subject.
export const AUDIT_ENTITY_TYPES = {
  USER: "USER",
  CASH_FUND: "CASH_FUND",
  CASH_FUND_USER: "CASH_FUND_USER",
} as const;

export type AuditEntityType =
  (typeof AUDIT_ENTITY_TYPES)[keyof typeof AUDIT_ENTITY_TYPES];

export const AUDIT_ACTIONS = {
  // F01 - accounts and sessions (debt deferred by ADR-008).
  USER_CREATED: "USER_CREATED",
  USER_DISABLED: "USER_DISABLED",
  USER_ENABLED: "USER_ENABLED",
  USER_SESSIONS_REVOKED: "USER_SESSIONS_REVOKED",

  // F02 - cash fund lifecycle and configuration (debt deferred by ADR-010).
  CASH_FUND_CREATED: "CASH_FUND_CREATED",
  CASH_FUND_DRAFT_UPDATED: "CASH_FUND_DRAFT_UPDATED",
  CASH_FUND_ACTIVATED: "CASH_FUND_ACTIVATED",
  CASH_FUND_DEACTIVATED: "CASH_FUND_DEACTIVATED",
  CASH_FUND_CONFIG_CHANGED: "CASH_FUND_CONFIG_CHANGED",

  // F03 - treasurer assignments (debt deferred by ADR-012).
  TREASURER_ASSIGNED: "TREASURER_ASSIGNED",
  TREASURER_UNASSIGNED: "TREASURER_UNASSIGNED",
} as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];

// Spanish labels for the audit log UI. Exhaustive by construction: adding an
// action without a label is a compile error.
export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  USER_CREATED: "Usuario creado",
  USER_DISABLED: "Usuario deshabilitado",
  USER_ENABLED: "Usuario habilitado",
  USER_SESSIONS_REVOKED: "Sesiones revocadas",
  CASH_FUND_CREATED: "Caja creada",
  CASH_FUND_DRAFT_UPDATED: "Borrador de caja editado",
  CASH_FUND_ACTIVATED: "Caja activada",
  CASH_FUND_DEACTIVATED: "Caja desactivada",
  CASH_FUND_CONFIG_CHANGED: "Configuración operativa modificada",
  TREASURER_ASSIGNED: "Tesorero asignado",
  TREASURER_UNASSIGNED: "Tesorero retirado",
};

export const AUDIT_ENTITY_LABELS: Record<AuditEntityType, string> = {
  USER: "Usuario",
  CASH_FUND: "Caja de ahorro",
  CASH_FUND_USER: "Asignación de tesorero",
};

// The stored action is a plain string, so a row written by a future feature (or
// a hand-inserted row) may not be in the union. Callers use this to decide
// between a friendly label and the raw value instead of crashing.
export function isKnownAuditAction(value: string): value is AuditAction {
  return value in AUDIT_ACTION_LABELS;
}

export function auditActionLabel(value: string): string {
  return isKnownAuditAction(value) ? AUDIT_ACTION_LABELS[value] : value;
}

export function auditEntityLabel(value: string): string {
  return value in AUDIT_ENTITY_LABELS
    ? AUDIT_ENTITY_LABELS[value as AuditEntityType]
    : value;
}
