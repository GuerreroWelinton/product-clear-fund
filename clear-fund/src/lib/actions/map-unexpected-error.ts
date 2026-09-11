interface DomainErrorConstructor<TCode, TError extends Error> {
  new (code: TCode, message?: string, options?: { cause?: unknown }): TError;
}

// Factory for the "funnel unexpected failures into our own error type"
// helper duplicated across modules' domain/errors.ts. Each feature keeps its
// own error class and error-code catalog (ADR-013 §9) — this only shares the
// wrapping logic. Pass the module's error class plus its fallback code and
// message to get back a one-line, module-specific `mapUnexpectedError`.
export function createUnexpectedErrorMapper<TCode, TError extends Error>(
  ErrorClass: DomainErrorConstructor<TCode, TError>,
  fallbackCode: TCode,
  fallbackMessage: string,
): (error: unknown) => TError {
  return function mapUnexpectedError(error: unknown): TError {
    if (error instanceof ErrorClass) {
      return error;
    }
    return new ErrorClass(
      fallbackCode,
      error instanceof Error ? error.message : fallbackMessage,
      { cause: error },
    );
  };
}
