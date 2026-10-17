import { describe, expect, it } from "vitest";
import { calculateQuote } from "@/lib/pricing";

describe("calculateQuote", () => {
  it("multiplies days by the daily rate", () => {
    expect(calculateQuote(50, "2026-10-10", "2026-10-13")).toEqual({ days: 3, dailyRate: 50, total: 150 });
  });

  it("never returns a negative total", () => {
    expect(calculateQuote(50, "2026-10-13", "2026-10-10").total).toBe(0);
  });
});
