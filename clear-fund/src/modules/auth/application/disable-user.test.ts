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
import { disableUser } from "./disable-user";

const headers = new Headers();
const bannedUser = {
  id: "user-1",
  email: "tess@example.com",
  name: "Tess Treasurer",
  role: "TREASURER",
  banned: true,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-03T00:00:00.000Z"),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("disableUser", () => {
  it("bans the user and revokes their sessions (BR-F01-004)", async () => {
    banUser.mockResolvedValue({ user: bannedUser });
    revokeUserSessions.mockResolvedValue({ success: true });

    const dto = await disableUser({ userId: "user-1" }, { headers });

    expect(banUser).toHaveBeenCalledWith({
      body: { userId: "user-1" },
      headers,
    });
    expect(revokeUserSessions).toHaveBeenCalledWith({
      body: { userId: "user-1" },
      headers,
    });
    expect(dto.banned).toBe(true);
    expect(dto.id).toBe("user-1");
  });

  it("forwards an optional ban reason", async () => {
    banUser.mockResolvedValue({ user: bannedUser });
    revokeUserSessions.mockResolvedValue({ success: true });

    await disableUser({ userId: "user-1", banReason: "left the fund" }, { headers });

    expect(banUser).toHaveBeenCalledWith({
      body: { userId: "user-1", banReason: "left the fund" },
      headers,
    });
  });

  it("maps a self-ban attempt to F01_CANNOT_MODIFY_SELF and does not revoke", async () => {
    banUser.mockRejectedValue({ body: { code: "YOU_CANNOT_BAN_YOURSELF" } });

    await expect(
      disableUser({ userId: "me" }, { headers }),
    ).rejects.toMatchObject({ code: F01_ERROR_CODES.CANNOT_MODIFY_SELF });
    expect(revokeUserSessions).not.toHaveBeenCalled();
  });
});
