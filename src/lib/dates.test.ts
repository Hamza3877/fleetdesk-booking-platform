import { describe, expect, it } from "vitest";
import { addDays, diffInDays, hasRangeConflict, isDayBooked, isValidISODate, lastDays } from "@/lib/dates";

describe("dates", () => {
  it("adds days across month boundaries", () => {
    expect(addDays("2026-10-30", 3)).toBe("2026-11-02");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("counts the days between two dates", () => {
    expect(diffInDays("2026-10-10", "2026-10-13")).toBe(3);
    expect(diffInDays("2026-10-10", "2026-10-10")).toBe(0);
  });

  it("rejects impossible dates", () => {
    expect(isValidISODate("2026-02-31")).toBe(false);
    expect(isValidISODate("10/10/2026")).toBe(false);
    expect(isValidISODate("2026-10-10")).toBe(true);
  });

  it("returns the last N days, oldest first", () => {
    expect(lastDays("2026-10-16", 3)).toEqual(["2026-10-14", "2026-10-15", "2026-10-16"]);
  });

  describe("booking conflicts", () => {
    const booked = [{ startDate: "2026-10-10", endDate: "2026-10-15" }];

    it("detects overlapping ranges", () => {
      expect(hasRangeConflict(booked, { startDate: "2026-10-12", endDate: "2026-10-14" })).toBe(true);
      expect(hasRangeConflict(booked, { startDate: "2026-10-08", endDate: "2026-10-11" })).toBe(true);
    });

    it("allows back-to-back bookings (return day is free)", () => {
      expect(hasRangeConflict(booked, { startDate: "2026-10-15", endDate: "2026-10-18" })).toBe(false);
      expect(hasRangeConflict(booked, { startDate: "2026-10-07", endDate: "2026-10-10" })).toBe(false);
    });

    it("marks only the nights in a booking as booked", () => {
      expect(isDayBooked(booked, "2026-10-10")).toBe(true);
      expect(isDayBooked(booked, "2026-10-14")).toBe(true);
      expect(isDayBooked(booked, "2026-10-15")).toBe(false);
    });
  });
});
