// Single place money is rounded and turned into a string. Everything else
// crossing a module boundary as "amount" or "balance" should go through this
// module instead of calling `.toString()`/`.toFixed()`/`Number()` directly
// (ARCHITECTURE.md "los cálculos monetarios viven en funciones puras y
// testeadas"; TECHNICAL_CONVENTIONS.md "nunca usar number para sumar,
// dividir o comparar dinero").
import { Decimal } from "decimal.js";

// Money crosses module boundaries as a decimal string (max 2 decimals) to
// avoid floating point drift; domain rules re-validate it is strictly > 0.
export const MONEY_PATTERN = /^\d+(\.\d{1,2})?$/;

// Anything Decimal-like: Prisma's Decimal and decimal.js's Decimal both
// expose toFixed with this signature. Naming this here lets every module
// that narrows to "has toFixed" (e.g. the audit domain's isDecimalLike
// guard) share one type instead of redeclaring the same inline shape.
export interface DecimalLike {
  toFixed(decimalPlaces?: number): string;
}

// Explicit financial rounding to two decimals (TECHNICAL_CONVENTIONS.md),
// half-up — matching PostgreSQL numeric(18,2) and decimal.js/Prisma's
// Decimal default rounding mode. Never routes through `Number()`: a plain
// JS float can misround an exact decimal like "1.005" (Number("1.005")
// .toFixed(2) === "1.00"), which is exactly the drift this module exists to
// avoid.
function roundToTwoDecimals(input: string | number): Decimal {
  return new Decimal(input).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
}

// The canonical serializer: the single place money becomes a string. A
// Decimal-like value (Prisma's Decimal or decimal.js's Decimal) already
// carries correct half-up rounding via toFixed(2); a raw string or number is
// parsed and rounded explicitly first. Either way the result always has
// exactly two decimals — "50.00", never "50" (API_CONVENTIONS.md "responder
// montos como strings decimales").
export function toMoneyString(value: DecimalLike | string | number): string {
  if (typeof value === "string" || typeof value === "number") {
    return roundToTwoDecimals(value).toFixed(2);
  }
  return value.toFixed(2);
}

const usdCurrencyFormatter = new Intl.NumberFormat("es-EC", {
  style: "currency",
  currency: "USD",
});

// UI display formatter (ARCHITECTURE.md "la UI no contiene cálculos
// financieros"): both cash-fund pages call this instead of rolling their
// own Number()-based formatAmount. Rounding happens here, explicitly, via
// Decimal; Intl.NumberFormat is only handed the already-rounded value and
// only does presentation (grouping, currency symbol).
export function formatMoneyDisplay(amount: string, currency: string): string {
  const rounded = roundToTwoDecimals(amount);
  if (currency === "USD") {
    return usdCurrencyFormatter.format(rounded.toNumber());
  }
  return `${rounded.toFixed(2)} ${currency}`;
}
