import { describe, expect, it } from "vitest";

import { resolveAssignAction, resolveUnassignAction } from "./rules";

describe("resolveAssignAction", () => {
  it("creates a new assignment when none exists", () => {
    expect(resolveAssignAction(null)).toBe("CREATE");
  });

  it("reactivates a previously revoked assignment (keeps history)", () => {
    expect(resolveAssignAction({ status: "REVOKED" })).toBe("REACTIVATE");
  });

  it("is a no-op when the assignment is already active (duplicate)", () => {
    expect(resolveAssignAction({ status: "ACTIVE" })).toBe("NOOP");
  });
});

describe("resolveUnassignAction", () => {
  it("revokes an active assignment", () => {
    expect(resolveUnassignAction({ status: "ACTIVE" })).toBe("REVOKE");
  });

  it("is a no-op when the assignment is already revoked", () => {
    expect(resolveUnassignAction({ status: "REVOKED" })).toBe("NOOP");
  });
});
