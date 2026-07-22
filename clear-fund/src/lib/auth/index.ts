import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin } from "better-auth/plugins";
import { createAccessControl } from "better-auth/plugins/access";
import { adminAc, defaultStatements } from "better-auth/plugins/admin/access";

import { prisma } from "@/lib/db";

// Global roles for the MVP (BR-F01-005). MEMBER is reserved for the future
// member portal (F25) and is intentionally not defined yet.
export const ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  TREASURER: "TREASURER",
} as const;

// Access control. The Super Admin has full user-management access; a treasurer
// has no account-management permissions (only the Super Admin manages users).
const ac = createAccessControl({ ...defaultStatements });
const superAdminRole = ac.newRole({ ...adminAc.statements });
const treasurerRole = ac.newRole({});

// Additional origins allowed to call the auth endpoints (CSRF protection).
// Comma-separated, read from the environment so volatile values like a LAN IP
// for on-device testing stay out of source control. The baseURL is always
// trusted, so this only needs the extra origins.
const extraTrustedOrigins =
  process.env.AUTH_TRUSTED_ORIGINS?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean) ?? [];

export const auth = betterAuth({
  // Secret and base URL are read from BETTER_AUTH_SECRET / BETTER_AUTH_URL.
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  trustedOrigins: extraTrustedOrigins,
  emailAndPassword: {
    enabled: true,
    // BR-F01-001: public registration is disabled. Accounts are created only
    // by a Super Admin through the admin plugin.
    disableSignUp: true,
  },
  plugins: [
    admin({
      ac,
      roles: {
        SUPER_ADMIN: superAdminRole,
        TREASURER: treasurerRole,
      },
      // BR-F01-005: a treasurer is the default administrative account; the
      // Super Admin role has global access.
      defaultRole: ROLES.TREASURER,
      adminRoles: [ROLES.SUPER_ADMIN],
    }),
  ],
});
