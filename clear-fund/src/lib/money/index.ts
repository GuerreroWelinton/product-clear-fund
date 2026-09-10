// Money crosses module boundaries as a decimal string (max 2 decimals) to
// avoid floating point drift; domain rules re-validate it is strictly > 0.
export const MONEY_PATTERN = /^\d+(\.\d{1,2})?$/;
