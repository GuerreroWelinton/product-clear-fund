import { beforeEach, describe, expect, it, vi } from "vitest";

const { listUsers: listUsersApi } = vi.hoisted(() => ({
  listUsers: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  auth: { api: { listUsers: listUsersApi } },
  ROLES: { SUPER_ADMIN: "SUPER_ADMIN", TREASURER: "TREASURER" },
}));

import { F01_ERROR_CODES } from "../domain/errors";
import { listUsers } from "./list-users";

const headers = new Headers();
const userRow = {
  id: "user-1",
  email: "tess@example.com",
  name: "Tess Treasurer",
  role: "TREASURER",
  banned: false,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-04T00:00:00.000Z"),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("listUsers", () => {
  it("returns the DTO list for an allowed caller (Better Auth's admin plugin approved it)", async () => {
    listUsersApi.mockResolvedValue({ users: [userRow], total: 1, limit: 200, offset: 0 });

    const users = await listUsers({ headers });

    expect(listUsersApi).toHaveBeenCalledWith({
      query: { limit: 200, sortBy: "createdAt", sortDirection: "desc" },
      headers,
    });
    expect(users).toEqual([
      {
        id: "user-1",
        email: "tess@example.com",
        name: "Tess Treasurer",
        role: "TREASURER",
        banned: false,
        createdAt: userRow.createdAt,
        updatedAt: userRow.updatedAt,
      },
    ]);
  });

  // Better Auth's admin plugin rejects a non-admin caller server-side (same
  // trust boundary create-treasurer.ts/disable-user.ts rely on) — this proves
  // that rejection reaches the caller as a stable F01 code, not a raw
  // Better Auth string.
  it("maps a forbidden caller to F01_UNAUTHORIZED", async () => {
    listUsersApi.mockRejectedValue({
      body: { code: "YOU_ARE_NOT_ALLOWED_TO_LIST_USERS" },
    });

    await expect(listUsers({ headers })).rejects.toMatchObject({
      code: F01_ERROR_CODES.UNAUTHORIZED,
    });
  });

  it("maps an unexpected failure to F01_OPERATION_FAILED", async () => {
    listUsersApi.mockRejectedValue(new Error("boom"));

    await expect(listUsers({ headers })).rejects.toMatchObject({
      code: F01_ERROR_CODES.OPERATION_FAILED,
    });
  });
});
