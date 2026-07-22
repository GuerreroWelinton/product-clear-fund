import { toNextJsHandler } from "better-auth/next-js";

import { auth } from "@/lib/auth";

// Better Auth mounts all its endpoints (sign-in, sign-out, admin, ...) here.
export const { GET, POST } = toNextJsHandler(auth);
