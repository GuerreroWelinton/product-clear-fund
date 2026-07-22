import { describe, expect, it } from "vitest";

import {
  createTreasurerSchema,
  disableUserSchema,
  enableUserSchema,
  revokeUserSessionsSchema,
} from "./index";

describe("auth schemas", () => {
  describe("createTreasurerSchema", () => {
    it("accepts a valid treasurer input", () => {
      const result = createTreasurerSchema.safeParse({
        email: "tess@example.com",
        name: "Tess Treasurer",
        password: "supersecret",
      });
      expect(result.success).toBe(true);
    });

    it("rejects an invalid email", () => {
      const result = createTreasurerSchema.safeParse({
        email: "not-an-email",
        name: "Tess",
        password: "supersecret",
      });
      expect(result.success).toBe(false);
    });

    it("rejects a password shorter than 8 characters", () => {
      const result = createTreasurerSchema.safeParse({
        email: "tess@example.com",
        name: "Tess",
        password: "short",
      });
      expect(result.success).toBe(false);
    });

    it("rejects an empty name", () => {
      const result = createTreasurerSchema.safeParse({
        email: "tess@example.com",
        name: "",
        password: "supersecret",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("userId-based schemas", () => {
    const schemas = [
      disableUserSchema,
      enableUserSchema,
      revokeUserSessionsSchema,
    ];

    it("accept a non-empty userId", () => {
      for (const schema of schemas) {
        expect(schema.safeParse({ userId: "user-1" }).success).toBe(true);
      }
    });

    it("reject a missing userId", () => {
      for (const schema of schemas) {
        expect(schema.safeParse({}).success).toBe(false);
      }
    });
  });
});
