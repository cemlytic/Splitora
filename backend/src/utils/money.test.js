import { describe, it, expect } from "vitest";
import { toCents, toDollars, splitEvenly } from "./money.js";

describe("toCents", () => {
  it("converts a decimal dollar amount to integer cents", () => {
    expect(toCents(12.5)).toBe(1250);
    expect(toCents("12.50")).toBe(1250);
  });

  it("rounds to the nearest cent instead of truncating", () => {
    expect(toCents(10.005)).toBe(1001);
  });

  it("returns null for invalid input", () => {
    expect(toCents("abc")).toBeNull();
    expect(toCents(NaN)).toBeNull();
  });
});

describe("toDollars", () => {
  it("converts integer cents back to a decimal dollar amount", () => {
    expect(toDollars(1250)).toBe(12.5);
    expect(toDollars(1)).toBe(0.01);
  });
});

describe("splitEvenly", () => {
  it("splits an amount that divides evenly", () => {
    expect(splitEvenly(300, 3)).toEqual([100, 100, 100]);
  });

  it("distributes leftover cents instead of losing them (the classic $100/3 bug)", () => {
    const parts = splitEvenly(10000, 3);
    expect(parts).toEqual([3334, 3333, 3333]);
    expect(parts.reduce((a, b) => a + b, 0)).toBe(10000);
  });

  it("matches the real $350 / 3 case we just tested manually on the phone", () => {
    const parts = splitEvenly(35000, 3);
    expect(parts).toEqual([11667, 11667, 11666]);
    expect(parts.reduce((a, b) => a + b, 0)).toBe(35000);
  });

  it("always sums back to the original total regardless of how ugly the division is", () => {
    const total = 999999;
    const count = 7;
    const parts = splitEvenly(total, count);
    expect(parts).toHaveLength(count);
    expect(parts.reduce((a, b) => a + b, 0)).toBe(total);
  });

  it("handles a single-person split", () => {
    expect(splitEvenly(500, 1)).toEqual([500]);
  });
});
