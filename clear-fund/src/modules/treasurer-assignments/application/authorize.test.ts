import { beforeEach, describe, expect, it, vi } from "vitest";

const { getSession } = vi.hoisted(() => ({
  getSession: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession } },
  ROLES: { SUPER_ADMIN: "SUPER_ADMIN", TREASURER: "TREASURER" },
}));

import { F03_ERROR_CODES } from "../domain/errors";
import { requireSession, requireSuperAdmin } from "./authorize";

const headers = new Headers();

beforeEach(() => {
  vi.clearAllMocks();
});

describe("requireSuperAdmin", () => {
  it("resolves for a SUPER_ADMIN", async () => {
    getSession.mockResolvedValue({ user: { id: "u1", role: "SUPER_ADMIN" } });
    await expect(requireSuperAdmin({ headers })).resolves.toMatchObject({
      user: { role: "SUPER_ADMIN" },
    });
  });

  it("rejects a TREASURER with F03_UNAUTHORIZED", async () => {
    getSession.mockResolvedValue({ user: { id: "u2", role: "TREASURER" } });
    await expect(requireSuperAdmin({ headers })).rejects.toMatchObject({
      code: F03_ERROR_CODES.UNAUTHORIZED,
    });
  });

  it("rejects when there is no session", async () => {
    getSession.mockResolvedValue(null);
    await expect(requireSuperAdmin({ headers })).rejects.toMatchObject({
      code: F03_ERROR_CODES.UNAUTHORIZED,
    });
  });
});

describe("requireSession", () => {
  it("resolves for any authenticated user", async () => {
    getSession.mockResolvedValue({ user: { id: "u2", role: "TREASURER" } });
    await expect(requireSession({ headers })).resolves.toBeTruthy();
  });

  it("rejects when there is no session", async () => {
    getSession.mockResolvedValue(null);
    await expect(requireSession({ headers })).rejects.toMatchObject({
      code: F03_ERROR_CODES.UNAUTHORIZED,
    });
  });
});
