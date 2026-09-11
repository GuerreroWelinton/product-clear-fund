// Shared shape for a server action's outcome: a discriminated union so
// callers narrow on `ok` before reading either branch.
export type ActionResult =
  | { ok: true }
  | { ok: false; code: string; message: string };
