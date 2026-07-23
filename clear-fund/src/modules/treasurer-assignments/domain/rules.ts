// Pure business rules for the treasurer-assignments feature (F03). No Prisma,
// no Next.js, no I/O — fully unit-testable in isolation.

// The action a use case must take, derived purely from the existing assignment
// state. Keeps idempotency (BR-F03-002/004, ADR-012) out of the I/O layer.
export type AssignAction = "CREATE" | "REACTIVATE" | "NOOP";
export type UnassignAction = "REVOKE" | "NOOP";

// Only the status matters here; typed as a plain string so a raw Prisma row
// can be passed straight in (the physical column is a string: ACTIVE|REVOKED).
interface ExistingAssignment {
  status: string;
}

// assignTreasurer idempotency:
// - no assignment yet        -> CREATE   (new ACTIVE row)
// - assignment REVOKED        -> REACTIVATE (flip back to ACTIVE, keep history)
// - assignment already ACTIVE -> NOOP     (duplicate assignment is a no-op)
export function resolveAssignAction(
  existing: ExistingAssignment | null,
): AssignAction {
  if (!existing) {
    return "CREATE";
  }
  return existing.status === "ACTIVE" ? "NOOP" : "REACTIVATE";
}

// unassignTreasurer, given an EXISTING assignment (a missing one is a genuine
// error resolved by the caller, not this rule):
// - assignment ACTIVE   -> REVOKE (soft-delete, never drop the row)
// - already REVOKED      -> NOOP  (idempotent re-revoke)
export function resolveUnassignAction(
  existing: ExistingAssignment,
): UnassignAction {
  return existing.status === "ACTIVE" ? "REVOKE" : "NOOP";
}
