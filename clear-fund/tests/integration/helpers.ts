import { randomUUID } from "node:crypto";

import { hashPassword } from "better-auth/crypto";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export { prisma };

// Wipe all auth tables so each test starts from a known-empty state. CASCADE
// clears dependent rows (session/account) and RESTART IDENTITY resets any
// sequences. Table names are the @@map-ed physical names.
export async function resetDb(): Promise<void> {
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE "cash_fund_user", "cash_fund", "session", "account", "user", "verification" RESTART IDENTITY CASCADE',
  );
}

export interface SeededUser {
  id: string;
  email: string;
  password: string;
}

// Writes a credential-backed user directly (same technique as prisma/seed.ts):
// a user row plus a `credential` account whose password is hashed with Better
// Auth's own hasher, so sign-in verifies correctly.
async function createCredentialUser(params: {
  email: string;
  name: string;
  password: string;
  role: string;
}): Promise<SeededUser> {
  const email = params.email.toLowerCase();
  const now = new Date();
  const userId = randomUUID();

  await prisma.user.create({
    data: {
      id: userId,
      email,
      name: params.name,
      emailVerified: true,
      role: params.role,
      createdAt: now,
      updatedAt: now,
    },
  });

  await prisma.account.create({
    data: {
      id: randomUUID(),
      accountId: userId,
      providerId: "credential",
      userId,
      password: await hashPassword(params.password),
      createdAt: now,
      updatedAt: now,
    },
  });

  return { id: userId, email, password: params.password };
}

// BR-F01-002: replicate the controlled Super Admin seed for tests.
export async function seedSuperAdmin(params: {
  email: string;
  password: string;
}): Promise<SeededUser> {
  return createCredentialUser({
    email: params.email,
    name: "Test Super Admin",
    password: params.password,
    role: "SUPER_ADMIN",
  });
}

export interface SignInResult {
  ok: boolean;
  // Headers carrying the session cookie, usable as an authenticated
  // RequestContext for admin use cases.
  authHeaders: Headers;
}

// Signs a user in through Better Auth and captures the Set-Cookie so callers
// can act as that authenticated user. Returns ok=false when sign-in is
// rejected (e.g. banned user), without throwing.
export async function signIn(params: {
  email: string;
  password: string;
}): Promise<SignInResult> {
  try {
    const { headers } = await auth.api.signInEmail({
      body: { email: params.email.toLowerCase(), password: params.password },
      returnHeaders: true,
    });

    const cookies = headers.getSetCookie();
    const authHeaders = new Headers();
    // Reduce Set-Cookie entries to a single Cookie header (name=value pairs).
    const cookiePairs = cookies
      .map((c) => c.split(";")[0])
      .filter((pair): pair is string => Boolean(pair));
    if (cookiePairs.length > 0) {
      authHeaders.set("cookie", cookiePairs.join("; "));
    }

    return { ok: cookiePairs.length > 0, authHeaders };
  } catch {
    return { ok: false, authHeaders: new Headers() };
  }
}

export async function countSessions(userId: string): Promise<number> {
  return prisma.session.count({ where: { userId } });
}
