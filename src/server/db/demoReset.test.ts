import { expect, it } from "vitest";
import { addDays, todayISO } from "@/lib/dates";
import { resetDemoData } from "@/server/db";
import { createBooking, listBookings } from "@/server/services/bookingService";
import { getSettings, updateSettings } from "@/server/services/settingsService";
import { createVehicle, deleteVehicle, listVehicles } from "@/server/services/vehicleService";
import { DEFAULT_BOOKING_QUERY } from "@/lib/bookingQuery";
import { describeWithBackends } from "@/server/testing/backends";

describeWithBackends("resetDemoData", () => {
  it("brings back the sample data after visitors changed, added and deleted things", async () => {
    const before = {
      vehicles: (await listVehicles()).length,
      bookings: (await listBookings({ ...DEFAULT_BOOKING_QUERY, pageSize: 1 })).total,
      settings: await getSettings(),
    };

    const added = await createVehicle({
      name: "Visitor Car", make: "Test", model: "Car", year: 2024, category: "compact", transmission: "manual",
      fuel: "petrol", seats: 4, pricePerDay: 30, description: "Added by a visitor to the demo.", features: [],
      color: "#111111", imageUrl: "", status: "available", featured: false,
    });
    const start = addDays(todayISO(), 400);
    await createBooking({
      vehicleId: added.id, startDate: start, endDate: addDays(start, 2),
      customerName: "Visitor", customerEmail: "visitor@example.com", customerPhone: "+1 555 0000",
    });
    await updateSettings({ ...before.settings, businessName: "Renamed By Visitor" });
    await expect(deleteVehicle(added.id)).rejects.toThrow(); // has a booking, so it stays until the reset

    await resetDemoData();

    expect((await listVehicles()).length).toBe(before.vehicles);
    expect((await listBookings({ ...DEFAULT_BOOKING_QUERY, pageSize: 1 })).total).toBe(before.bookings);
    expect((await getSettings()).businessName).toBe(before.settings.businessName);
    expect((await listVehicles()).some((vehicle) => vehicle.name === "Visitor Car")).toBe(false);
  });
});
