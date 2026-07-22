import type { NextConfig } from "next";

// Hosts allowed to access Next.js dev resources (e.g. HMR) when testing from
// other devices on the LAN, like a phone. Read from the environment so the
// volatile IP stays out of source control. Expects bare hosts, so the scheme
// and port are stripped from each origin.
const allowedDevOrigins =
  process.env.AUTH_TRUSTED_ORIGINS?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
    .map((origin) => origin.replace(/^https?:\/\//, "").replace(/:\d+$/, "")) ?? [];

const nextConfig: NextConfig = {
  allowedDevOrigins,
};

export default nextConfig;
