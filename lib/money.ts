/**
 * Integer-cents money helpers.
 *
 * Money in this app is currently stored as `Float` dollars (see
 * `prisma/schema.prisma`), which silently accumulates rounding error once
 * amounts are summed — the classic `0.1 + 0.2 !== 0.3` problem. This module
 * is the precise-integer-cents foundation for a future Float -> cents
 * migration: store and add money as integer cents, and only convert to/from
 * a dollar float at the edges (e.g. formatting for display).
 *
 * Negative cent values are allowed everywhere below — refunds, credits, and
 * balance adjustments are legitimate negative amounts. Callers that need a
 * non-negative amount (e.g. a listing price) must validate that themselves;
 * this module only guards against non-finite / non-integer input.
 *
 * Pure, dependency-free (aside from the built-in `Intl` API).
 */

function assertFinite(value: number, label: string): void {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${label} must be a finite number, got ${value}`);
  }
}

function assertIntegerCents(value: number, label: string): void {
  assertFinite(value, label);
  if (!Number.isInteger(value)) {
    throw new Error(
      `${label} must be an integer number of cents, got ${value}`,
    );
  }
}

/**
 * Convert a dollar amount (e.g. `19.99`) to integer cents (`1999`).
 *
 * Rounds to the nearest cent with `Math.round`, which also absorbs the
 * float noise that dollar-float arithmetic produces (e.g. `19.99 * 100` is
 * `1998.9999999999998` in IEEE-754 double precision, and `Math.round`
 * corrects it back to `1999`).
 *
 * Throws a clear `Error` if `dollars` is `NaN`, `Infinity`/`-Infinity`, or
 * otherwise not a finite number.
 */
export function toCents(dollars: number): number {
  assertFinite(dollars, "dollars");
  return Math.round(dollars * 100);
}

/**
 * Convert integer cents (`1999`) back to a dollar amount (`19.99`).
 *
 * Throws if `cents` isn't a finite integer.
 */
export function fromCents(cents: number): number {
  assertIntegerCents(cents, "cents");
  return cents / 100;
}

/**
 * Add two integer-cent amounts.
 *
 * Plain integer addition: JS numbers represent integers exactly up to
 * 2^53 - 1 (`Number.MAX_SAFE_INTEGER`), so unlike dollar-float addition
 * this never drifts.
 */
export function addCents(a: number, b: number): number {
  assertIntegerCents(a, "a");
  assertIntegerCents(b, "b");
  return a + b;
}

/**
 * Sum a list of integer-cent amounts. Returns `0` for an empty list.
 *
 * This is the fix for the classic float trap: summing dollar floats can
 * give `0.1 + 0.2 === 0.30000000000000004`, but summing the equivalent
 * integer cents is exact.
 */
export function sumCents(values: number[]): number {
  return values.reduce((total: number, value, index) => {
    assertIntegerCents(value, `values[${index}]`);
    return total + value;
  }, 0);
}

/**
 * Format integer cents as a localized currency string, e.g.
 * `formatCents(1999)` -> `"$19.99"`, `formatCents(1999, "EUR")` -> `"€19.99"`.
 *
 * Negative cents format with a leading minus sign (e.g. `"-$5.00"`), which
 * is correct for refunds/adjustments.
 */
export function formatCents(cents: number, currency = "USD"): string {
  assertIntegerCents(cents, "cents");
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(fromCents(cents));
}
