// Every use case runs on behalf of a caller. Authorization is re-checked
// server-side from the request headers (see authorize.ts), so we forward
// them through the context — never trust a client-supplied role/user id.
export interface RequestContext {
  headers: Headers;
}
