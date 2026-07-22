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
import { revokeUserSessions as revokeUserSessionsUseCase } from "./revoke-user-sessions";

const headers = new Headers();

beforeEach(() => {
  vi.clearAllMocks();
});

describe("revokeUserSessions", () => {
  it("revokes all sessions for a user", async () => {
    revokeUserSessions.mockResolvedValue({ success: true });

    const result = await revokeUserSessionsUseCase({ userId: "user-1" }, { headers });

    expect(revokeUserSessions).toHaveBeenCalledWith({
      body: { userId: "user-1" },
      headers,
    });
    expect(result).toEqual({ success: true });
  });

  it("maps a forbidden caller to F01_UNAUTHORIZED", async () => {
    revokeUserSessions.mockRejectedValue({
      body: { code: "YOU_ARE_NOT_ALLOWED_TO_REVOKE_USERS_SESSIONS" },
    });
    await expect(
      revokeUserSessionsUseCase({ userId: "user-1" }, { headers }),
    ).rejects.toMatchObject({ code: F01_ERROR_CODES.UNAUTHORIZED });
  });
});
