import { describe, it, expect } from "vitest";

import { toCents, fromCents, addCents, sumCents, formatCents } from "@/lib/money";

describe("toCents", () => {
  it("converts a simple dollar amount to cents", () => {
    expect(toCents(19.99)).toBe(1999);
    expect(toCents(1)).toBe(100);
    expect(toCents(0)).toBe(0);
  });

  it("rounds 2.675 to the nearest cent (268, not the truncated 267)", () => {
    // 2.675 * 100 lands on exactly 267.5 in IEEE-754 double precision, and
    // Math.round takes .5 up — so this should round to $2.68, not $2.67.
    expect(toCents(2.675)).toBe(268);
  });

  it("absorbs float noise from dollar multiplication", () => {
    // 19.99 * 100 === 1998.9999999999998 in raw float arithmetic; toCents
    // must still land on the intended 1999.
    expect(toCents(19.99)).toBe(1999);
  });

  it("handles negative dollar amounts (refunds/adjustments)", () => {
    expect(toCents(-19.99)).toBe(-1999);
  });

  it("fixes the classic 0.1 + 0.2 float trap via sumCents", () => {
    // Plain float addition: 0.1 + 0.2 === 0.30000000000000004 !== 0.3.
    expect(0.1 + 0.2).not.toBe(0.3);
    // Going through integer cents sidesteps the drift entirely.
    expect(sumCents([toCents(0.1), toCents(0.2)])).toBe(toCents(0.3));
  });

  it("throws a clear error on NaN", () => {
    expect(() => toCents(NaN)).toThrow(/finite/i);
  });

  it("throws a clear error on Infinity and -Infinity", () => {
    expect(() => toCents(Infinity)).toThrow(/finite/i);
    expect(() => toCents(-Infinity)).toThrow(/finite/i);
  });
});

describe("fromCents", () => {
  it("converts cents back to a dollar amount", () => {
    expect(fromCents(1999)).toBe(19.99);
    expect(fromCents(100)).toBe(1);
    expect(fromCents(0)).toBe(0);
  });

  it("round-trips through toCents/fromCents for typical prices", () => {
    for (const dollars of [0, 1, 19.99, 0.5, 100.01, 2.675, -19.99, 1234.56]) {
      expect(fromCents(toCents(dollars))).toBeCloseTo(
        Math.round(dollars * 100) / 100,
        10,
      );
    }
  });

  it("throws on non-integer cents", () => {
    expect(() => fromCents(19.99)).toThrow(/integer/i);
  });

  it("throws on non-finite cents", () => {
    expect(() => fromCents(NaN)).toThrow(/finite/i);
    expect(() => fromCents(Infinity)).toThrow(/finite/i);
  });
});

describe("addCents", () => {
  it("adds two integer cent amounts exactly", () => {
    expect(addCents(toCents(0.1), toCents(0.2))).toBe(toCents(0.3));
    expect(addCents(100, 200)).toBe(300);
  });

  it("allows negative amounts for refunds/adjustments", () => {
    expect(addCents(1000, -300)).toBe(700);
    expect(addCents(-100, -200)).toBe(-300);
  });

  it("throws on non-integer input", () => {
    expect(() => addCents(1.5, 2)).toThrow(/integer/i);
    expect(() => addCents(1, 2.5)).toThrow(/integer/i);
  });

  it("throws on non-finite input", () => {
    expect(() => addCents(NaN, 1)).toThrow(/finite/i);
    expect(() => addCents(1, Infinity)).toThrow(/finite/i);
  });
});

describe("sumCents", () => {
  it("sums a list of integer cent amounts without float drift", () => {
    expect(sumCents([toCents(0.1), toCents(0.2)])).toBe(toCents(0.3));
    expect(sumCents([100, 200, 300])).toBe(600);
  });

  it("returns 0 for an empty list", () => {
    expect(sumCents([])).toBe(0);
  });

  it("sums many small amounts exactly (no accumulated drift)", () => {
    const tenCents = toCents(0.1);
    const values = new Array(10).fill(tenCents);
    expect(sumCents(values)).toBe(toCents(1));
  });

  it("allows negative amounts to net out a sum", () => {
    expect(sumCents([500, -200, -100])).toBe(200);
  });

  it("throws on a non-integer entry, identifying its index", () => {
    expect(() => sumCents([100, 2.5, 300])).toThrow(/values\[1\]/);
  });

  it("throws on a non-finite entry", () => {
    expect(() => sumCents([100, NaN])).toThrow(/finite/i);
  });
});

describe("formatCents", () => {
  it("formats USD by default", () => {
    expect(formatCents(1999)).toBe("$19.99");
    expect(formatCents(0)).toBe("$0.00");
    expect(formatCents(100)).toBe("$1.00");
  });

  it("formats other currencies, e.g. EUR", () => {
    expect(formatCents(1999, "EUR")).toBe("€19.99");
  });

  it("formats negative cents with a minus sign", () => {
    expect(formatCents(-500)).toBe("-$5.00");
  });

  it("throws on non-integer cents", () => {
    expect(() => formatCents(19.99)).toThrow(/integer/i);
  });

  it("throws on non-finite cents", () => {
    expect(() => formatCents(NaN)).toThrow(/finite/i);
    expect(() => formatCents(Infinity)).toThrow(/finite/i);
  });
});
