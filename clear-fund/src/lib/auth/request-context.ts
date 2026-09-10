import { headers } from "next/headers";

// Every use case runs on behalf of a caller. Authorization is re-checked
// server-side from the request headers (see authorize.ts), so we forward
// them through the context — never trust a client-supplied role/user id.
export interface RequestContext {
  headers: Headers;
}

// Server-only helper: builds the per-request context passed to every use
// case. Kept in a plain (non-"use server") module, since a "use server" file
// may only export async functions.
export async function requestContext(): Promise<RequestContext> {
  return { headers: await headers() };
}
