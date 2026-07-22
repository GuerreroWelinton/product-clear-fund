// Every use case runs on behalf of a caller. Better Auth enforces the admin
// authorization server-side from the request headers, so we forward them.
export interface RequestContext {
  headers: Headers;
}
