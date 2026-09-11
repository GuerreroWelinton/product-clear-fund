// Page size is capped so a caller cannot request a whole append-only table
// (the audit log, a cash fund's ledger) in one query. Shared by both schemas
// that page such a table so the two limits cannot drift apart by accident.
//
// Both pages also read `pageSize` straight from the URL with no UI control to
// change it. That is deliberate, not an oversight: it lets the page length be
// tuned via a query param without a code change, and the cap below is exactly
// what makes that safe — a bogus or oversized value can never widen a query
// past what these pages are designed to render.
export const PAGE_SIZE_MAX = 100;
export const PAGE_SIZE_DEFAULT = 25;
