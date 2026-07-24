// Pure business rules for the audit-log feature (F23). No Prisma, no Next.js,
// no I/O — fully unit-testable in isolation.

// A single JSON-safe audit value. Decimals and Dates are normalized to strings
// before they ever reach this type (see toAuditValue).
export type AuditValue = string | number | boolean | null;

export interface AuditFieldChange {
  previous: AuditValue;
  next: AuditValue;
}

// Field-level diff persisted in AuditEvent.changes.
export type AuditChangeSet = Record<string, AuditFieldChange>;

// The marker written instead of a secret's value (BR-F23-004). The field name is
// KEPT so the log still shows THAT it changed, without exposing WHAT it changed
// to — omitting the field entirely would hide the change itself.
export const REDACTED = "[REDACTED]";

// Substrings that mark a field as sensitive, matched case-insensitively against
// the field name (BR-F23-004). Deliberately a denylist of name fragments rather
// than an exact-name list: `password`, `newPassword` and `passwordHash` must all
// be caught without enumerating every future variant.
const SENSITIVE_FIELD_FRAGMENTS = [
  "password",
  "token",
  "secret",
  "hash",
  "apikey",
  "credential",
  "privatekey",
];

export function isSensitiveField(field: string): boolean {
  const normalized = field.toLowerCase();
  return SENSITIVE_FIELD_FRAGMENTS.some((fragment) =>
    normalized.includes(fragment),
  );
}

// Anything Decimal-like: Prisma's Decimal and decimal.js both expose toFixed.
// Money must reach the audit log as a decimal STRING, never a JS number
// (TECHNICAL_CONVENTIONS.md).
function isDecimalLike(value: object): value is { toFixed(dp?: number): string } {
  return "toFixed" in value && typeof value.toFixed === "function";
}

// Normalizes a raw value into something JSON-safe and stable to compare.
// undefined collapses to null so "absent" and "explicitly null" read the same in
// the log; Dates become ISO strings; Decimals become decimal strings.
export function toAuditValue(value: unknown): AuditValue {
  if (value === undefined || value === null) {
    return null;
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === "object") {
    if (isDecimalLike(value)) {
      return value.toString();
    }
    // Arrays / nested objects are not part of any audited write today. Encoding
    // them as JSON keeps the log honest instead of storing "[object Object]".
    return JSON.stringify(value);
  }
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }
  // bigint, symbol, function: no audited write produces these.
  return String(value);
}

function redactIfSensitive(field: string, value: AuditValue): AuditValue {
  return isSensitiveField(field) ? REDACTED : value;
}

// Diff of an UPDATE: only the fields whose normalized value actually changed
// (BR-F23-002 — the log describes a change, so unchanged fields are noise).
// Sensitive values are redacted on both sides (BR-F23-004).
//
// A sensitive field is reported as changed whenever it is present in `next`,
// because its redacted values are always equal and comparing them would hide
// every password change.
export function buildChangeSet(
  previous: Record<string, unknown>,
  next: Record<string, unknown>,
): AuditChangeSet {
  const changes: AuditChangeSet = {};

  for (const field of Object.keys(next)) {
    const sensitive = isSensitiveField(field);
    const previousValue = toAuditValue(previous[field]);
    const nextValue = toAuditValue(next[field]);

    if (!sensitive && previousValue === nextValue) {
      continue;
    }

    changes[field] = {
      previous: redactIfSensitive(field, previousValue),
      next: redactIfSensitive(field, nextValue),
    };
  }

  return changes;
}

// Diff of a CREATE: there is no previous state, so every provided field is
// recorded with previous = null.
export function buildCreationChangeSet(
  values: Record<string, unknown>,
): AuditChangeSet {
  const changes: AuditChangeSet = {};

  for (const field of Object.keys(values)) {
    changes[field] = {
      previous: null,
      next: redactIfSensitive(field, toAuditValue(values[field])),
    };
  }

  return changes;
}

// An empty change set is stored as null rather than `{}`, so "no field-level
// detail" is one representation instead of two.
export function normalizeChangeSet(
  changes: AuditChangeSet,
): AuditChangeSet | null {
  return Object.keys(changes).length === 0 ? null : changes;
}

// ---------------------------------------------------------------------------
// Read visibility (FR-F23-001 / FR-F23-002 / BR-F23-005 of F03)
// ---------------------------------------------------------------------------

// Which events the caller may read. ALL = every event including global ones
// (cashFundId = null); FUNDS = only events belonging to the listed funds, never
// global ones; FORBIDDEN = the caller asked for a fund they cannot see.
export type AuditScope =
  | { kind: "ALL" }
  | { kind: "FUNDS"; cashFundIds: string[] }
  | { kind: "FORBIDDEN" };

// Only a Super Admin reads the global log, which includes events with no fund
// (user created/disabled). A treasurer is always fund-scoped (ADR-013).
export function resolveAuditScope(params: {
  isSuperAdmin: boolean;
  requestedCashFundId: string | null;
  assignedCashFundIds: string[];
}): AuditScope {
  const { isSuperAdmin, requestedCashFundId, assignedCashFundIds } = params;

  if (isSuperAdmin) {
    return requestedCashFundId === null
      ? { kind: "ALL" }
      : { kind: "FUNDS", cashFundIds: [requestedCashFundId] };
  }

  if (requestedCashFundId === null) {
    return { kind: "FUNDS", cashFundIds: [...assignedCashFundIds] };
  }

  return assignedCashFundIds.includes(requestedCashFundId)
    ? { kind: "FUNDS", cashFundIds: [requestedCashFundId] }
    : { kind: "FORBIDDEN" };
}

// Whether a single already-loaded event is readable under a scope. Used by
// getAuditEvent, which finds the row by id and only then checks access — so a
// treasurer cannot read another fund's event, nor any global event.
export function isEventVisible(
  scope: AuditScope,
  event: { cashFundId: string | null },
): boolean {
  if (scope.kind === "ALL") {
    return true;
  }
  if (scope.kind === "FORBIDDEN") {
    return false;
  }
  return (
    event.cashFundId !== null && scope.cashFundIds.includes(event.cashFundId)
  );
}

// ---------------------------------------------------------------------------
// Operation linking (BR-F23-005)
// ---------------------------------------------------------------------------

export interface AuditEventLink {
  relatedEventId: string;
  correlationId: string;
}

// BR-F23-005: an event derived from an earlier operation (a reversal, a
// settlement, a correction) must link back to the original.
//
// `relatedEventId` points at the original event. `correlationId` groups every
// event of one business operation: if the original already belongs to a group we
// inherit it, otherwise the original's own id opens the group. This keeps the
// whole chain queryable by a single value no matter how long it grows.
//
// No F23 use case calls this: no financial operation exists yet to reverse. It
// is the seam F09 (partial reversals) and F20 (ledger) will use, and it is the
// concrete deliverable for BR-F23-005 in F23 (ADR-013).
export function linkToOriginalEvent(original: {
  id: string;
  correlationId: string | null;
}): AuditEventLink {
  return {
    relatedEventId: original.id,
    correlationId: original.correlationId ?? original.id,
  };
}
