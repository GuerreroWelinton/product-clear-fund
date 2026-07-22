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
import { createTreasurer } from "./create-treasurer";

const headers = new Headers();
const sampleUser = {
  id: "user-1",
  email: "tess@example.com",
  name: "Tess Treasurer",
  role: "TREASURER",
  banned: false,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-02T00:00:00.000Z"),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("createTreasurer", () => {
  it("creates a TREASURER through the admin API and returns a safe DTO", async () => {
    createUser.mockResolvedValue({ user: sampleUser });

    const dto = await createTreasurer(
      { email: "tess@example.com", name: "Tess Treasurer", password: "supersecret" },
      { headers },
    );

    expect(createUser).toHaveBeenCalledWith({
      body: {
        email: "tess@example.com",
        name: "Tess Treasurer",
        password: "supersecret",
        role: "TREASURER",
      },
      headers,
    });
    expect(dto).toEqual({
      id: "user-1",
      email: "tess@example.com",
      name: "Tess Treasurer",
      role: "TREASURER",
      banned: false,
      createdAt: sampleUser.createdAt,
      updatedAt: sampleUser.updatedAt,
    });
    expect(dto).not.toHaveProperty("password");
  });

  it("rejects invalid input with F01_INVALID_INPUT and never calls the API", async () => {
    await expect(
      createTreasurer({ email: "bad", name: "", password: "x" }, { headers }),
    ).rejects.toMatchObject({ code: F01_ERROR_CODES.INVALID_INPUT });
    expect(createUser).not.toHaveBeenCalled();
  });

  it("maps a duplicate email to F01_EMAIL_TAKEN", async () => {
    createUser.mockRejectedValue({
      body: { code: "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL" },
    });
    await expect(
      createTreasurer(
        { email: "tess@example.com", name: "Tess", password: "supersecret" },
        { headers },
      ),
    ).rejects.toMatchObject({ code: F01_ERROR_CODES.EMAIL_TAKEN });
  });

  it("maps a forbidden caller to F01_UNAUTHORIZED", async () => {
    createUser.mockRejectedValue({
      body: { code: "YOU_ARE_NOT_ALLOWED_TO_CREATE_USERS" },
    });
    await expect(
      createTreasurer(
        { email: "tess@example.com", name: "Tess", password: "supersecret" },
        { headers },
      ),
    ).rejects.toMatchObject({ code: F01_ERROR_CODES.UNAUTHORIZED });
  });
});
