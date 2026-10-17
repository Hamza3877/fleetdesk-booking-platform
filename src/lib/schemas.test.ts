import { describe, expect, it } from "vitest";
import { addDays, todayISO } from "@/lib/dates";
import { customerSchema, datesSchema, parseFeatures, vehicleInputSchema } from "@/lib/schemas";

describe("datesSchema", () => {
  const today = todayISO();

  it("accepts a future range", () => {
    expect(datesSchema.safeParse({ startDate: addDays(today, 1), endDate: addDays(today, 3) }).success).toBe(true);
  });

  it("rejects a pickup date in the past", () => {
    expect(datesSchema.safeParse({ startDate: addDays(today, -1), endDate: addDays(today, 2) }).success).toBe(false);
  });

  it("rejects a return date that is not after pickup", () => {
    const result = datesSchema.safeParse({ startDate: addDays(today, 2), endDate: addDays(today, 2) });
    expect(result.success).toBe(false);
  });
});

describe("customerSchema", () => {
  it("rejects letters in the phone number", () => {
    const result = customerSchema.safeParse({ customerName: "Hamza", customerEmail: "h@example.com", customerPhone: "call me maybe" });
    expect(result.success).toBe(false);
  });
});

describe("vehicleInputSchema", () => {
  const valid = {
    name: "Test Car", make: "Test", model: "One", year: 2024, category: "suv", transmission: "automatic", fuel: "petrol",
    seats: 5, pricePerDay: 80, description: "A test vehicle for the suite.", features: [], color: "#112233", imageUrl: "",
    status: "available", featured: false,
  };

  it("accepts a valid vehicle", () => {
    expect(vehicleInputSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects a price that is too low", () => {
    expect(vehicleInputSchema.safeParse({ ...valid, pricePerDay: 1 }).success).toBe(false);
  });

  it("accepts an uploaded image but rejects javascript: links", () => {
    expect(vehicleInputSchema.safeParse({ ...valid, imageUrl: "data:image/jpeg;base64,AAAA" }).success).toBe(true);
    expect(vehicleInputSchema.safeParse({ ...valid, imageUrl: "javascript:alert(1)" }).success).toBe(false);
  });
});

describe("parseFeatures", () => {
  it("splits, trims and drops empty items", () => {
    expect(parseFeatures(" Bluetooth, ,Backup camera ,")).toEqual(["Bluetooth", "Backup camera"]);
  });
});
