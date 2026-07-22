import { adminClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

// Browser client. Base URL defaults to the current origin (same-origin API).
export const authClient = createAuthClient({
  plugins: [adminClient()],
});

export const { signIn, signOut, useSession } = authClient;
