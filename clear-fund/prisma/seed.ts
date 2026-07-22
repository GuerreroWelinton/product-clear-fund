import { randomBytes, randomUUID } from "node:crypto";

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "better-auth/crypto";

import { PrismaClient } from "../src/generated/prisma/client";

// BR-F01-002: the first Super Admin is created by a controlled seed, since
// public registration is disabled. This bypasses the admin-gated API on
// purpose (there is no admin yet) by writing the user + credential account
// directly, using Better Auth's own password hashing so sign-in works.
const SUPER_ADMIN_EMAIL = "welin-213@hotmail.com";
const SUPER_ADMIN_NAME = "Welinton Guerrero";
const SUPER_ADMIN_ROLE = "SUPER_ADMIN";

async function main(): Promise<void> {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  try {
    const email = SUPER_ADMIN_EMAIL.toLowerCase();

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      console.log(`Super Admin already exists (${email}); nothing to do.`);
      return;
    }

    // URL-safe, ~24 chars of entropy. Printed once below.
    const password = randomBytes(18).toString("base64url");
    const hashedPassword = await hashPassword(password);
    const now = new Date();
    const userId = randomUUID();

    await prisma.user.create({
      data: {
        id: userId,
        email,
        name: SUPER_ADMIN_NAME,
        emailVerified: true,
        role: SUPER_ADMIN_ROLE,
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
        password: hashedPassword,
        createdAt: now,
        updatedAt: now,
      },
    });

    console.log("Super Admin created:");
    console.log(`  email:    ${email}`);
    console.log(`  password: ${password}`);
    console.log("Store this password now — it will not be shown again.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
