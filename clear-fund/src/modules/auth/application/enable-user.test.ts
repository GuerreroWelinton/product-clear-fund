import { beforeEach, describe, expect, it, vi } from "vitest";

const { createUser, banUser, unbanUser, revokeUserSessions } = vi.hoisted(
  () => ({
    createUser: vi.fn(),
    banUser: vi.fn(),
    unbanUser: vi.fn(),
    revokeUserSessions: vi.fn(),
  }),
);

vi.mock("@/lib/auth", () => ({
  auth: { api: { createUser, banUser, unbanUser, revokeUserSessions } },
  ROLES: { SUPER_ADMIN: "SUPER_ADMIN", TREASURER: "TREASURER" },
}));

import { F01_ERROR_CODES } from "../domain/errors";
import { enableUser } from "./enable-user";

const headers = new Headers();
const activeUser = {
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

describe("enableUser", () => {
  it("unbans the user and returns the DTO", async () => {
    unbanUser.mockResolvedValue({ user: activeUser });

    const dto = await enableUser({ userId: "user-1" }, { headers });

    expect(unbanUser).toHaveBeenCalledWith({
      body: { userId: "user-1" },
      headers,
    });
    expect(dto.banned).toBe(false);
    expect(dto.id).toBe("user-1");
  });

  it("maps a forbidden caller to F01_UNAUTHORIZED", async () => {
    unbanUser.mockRejectedValue({
      body: { code: "YOU_ARE_NOT_ALLOWED_TO_BAN_USERS" },
    });
    await expect(
      enableUser({ userId: "user-1" }, { headers }),
    ).rejects.toMatchObject({ code: F01_ERROR_CODES.UNAUTHORIZED });
  });
});
