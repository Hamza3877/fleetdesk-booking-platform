import { describe, expect, it } from "vitest";
import { addDays, todayISO } from "@/lib/dates";
import { DEFAULT_BOOKING_QUERY } from "@/lib/bookingQuery";
import { ConflictError } from "@/server/errors";
import { describeWithBackends } from "@/server/testing/backends";
import {
  HOLD_MINUTES,
  createBooking,
  getBooking,
  listBookings,
  markBookingPaid,
  releaseExpiredHolds,
  updateBookingStatus,
} from "@/server/services/bookingService";
import { getBookedRanges, listVehicles } from "@/server/services/vehicleService";

const customer = { customerName: "Test Customer", customerEmail: "test@example.com", customerPhone: "+1 555 0100" };

async function freeVehicle() {
  const start = addDays(todayISO(), 90);
  const [vehicle] = await listVehicles({ status: "available", startDate: start, endDate: addDays(start, 3) });
  return { vehicle, startDate: start, endDate: addDays(start, 3) };
}

describeWithBackends("bookingService", () => {
  it("creates a pending, unpaid booking with the right price", async () => {
    const { vehicle, startDate, endDate } = await freeVehicle();
    const booking = await createBooking({ vehicleId: vehicle.id, startDate, endDate, ...customer });

    expect(booking.status).toBe("pending");
    expect(booking.paymentStatus).toBe("unpaid");
    expect(booking.totalPrice).toBe(vehicle.pricePerDay * 3);
    expect(booking.reference).toMatch(/^FD-\d+$/);
  });

  it("blocks double booking of the same dates", async () => {
    const { vehicle, startDate, endDate } = await freeVehicle();
    await createBooking({ vehicleId: vehicle.id, startDate, endDate, ...customer });

    await expect(createBooking({ vehicleId: vehicle.id, startDate, endDate, ...customer })).rejects.toThrow(ConflictError);
  });

  it("lets only one of two simultaneous bookings win", async () => {
    const { vehicle, startDate, endDate } = await freeVehicle();
    const attempt = () => createBooking({ vehicleId: vehicle.id, startDate, endDate, ...customer });

    const results = await Promise.allSettled([attempt(), attempt()]);

    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    const failed = results.find((result) => result.status === "rejected") as PromiseRejectedResult;
    expect(failed.reason).toBeInstanceOf(ConflictError);
  });

  it("allows a new booking to start on the return day", async () => {
    const { vehicle, startDate, endDate } = await freeVehicle();
    await createBooking({ vehicleId: vehicle.id, startDate, endDate, ...customer });

    await expect(
      createBooking({ vehicleId: vehicle.id, startDate: endDate, endDate: addDays(endDate, 2), ...customer }),
    ).resolves.toBeDefined();
  });

  it("confirms the booking after payment", async () => {
    const { vehicle, startDate, endDate } = await freeVehicle();
    const booking = await createBooking({ vehicleId: vehicle.id, startDate, endDate, ...customer });

    const paid = await markBookingPaid(booking.id);
    expect(paid.status).toBe("confirmed");
    expect(paid.paymentStatus).toBe("paid");
    expect((await getBooking(booking.id))?.status).toBe("confirmed");
  });

  it("releases the dates when the checkout hold expires", async () => {
    const { vehicle, startDate, endDate } = await freeVehicle();
    await createBooking({ vehicleId: vehicle.id, startDate, endDate, ...customer });
    expect((await getBookedRanges(vehicle.id)).some((range) => range.startDate === startDate)).toBe(true);

    await releaseExpiredHolds(Date.now() + (HOLD_MINUTES + 1) * 60 * 1000);
    expect((await getBookedRanges(vehicle.id)).some((range) => range.startDate === startDate)).toBe(false);
  });

  it("refuses to confirm an expired checkout whose dates were taken by someone else", async () => {
    const { vehicle, startDate, endDate } = await freeVehicle();
    const first = await createBooking({ vehicleId: vehicle.id, startDate, endDate, ...customer });
    await releaseExpiredHolds(Date.now() + (HOLD_MINUTES + 1) * 60 * 1000);
    await createBooking({ vehicleId: vehicle.id, startDate, endDate, ...customer });

    await expect(markBookingPaid(first.id)).rejects.toThrow(ConflictError);
  });

  it("only allows valid status changes and refunds paid cancellations", async () => {
    const { vehicle, startDate, endDate } = await freeVehicle();
    const booking = await createBooking({ vehicleId: vehicle.id, startDate, endDate, ...customer });
    await markBookingPaid(booking.id);

    await expect(updateBookingStatus(booking.id, "completed")).rejects.toThrow(ConflictError);

    const cancelled = await updateBookingStatus(booking.id, "cancelled");
    expect(cancelled.paymentStatus).toBe("refunded");
  });

  describe("listing", () => {
    it("searches, filters and paginates", async () => {
      const everything = await listBookings({ ...DEFAULT_BOOKING_QUERY, pageSize: 5 });
      expect(everything.items).toHaveLength(5);
      expect(everything.totalPages).toBe(Math.ceil(everything.total / 5));

      const cancelled = await listBookings({ ...DEFAULT_BOOKING_QUERY, status: "cancelled", pageSize: 50 });
      expect(cancelled.items.length).toBeGreaterThan(0);
      expect(cancelled.items.every((item) => item.status === "cancelled")).toBe(true);

      const one = everything.items[0];
      const found = await listBookings({ ...DEFAULT_BOOKING_QUERY, search: one.reference });
      expect(found.items.map((item) => item.id)).toContain(one.id);
      expect(found.items[0].vehicleName).toBeTruthy();
    });

    it("sorts by price in both directions", async () => {
      const cheapFirst = await listBookings({ ...DEFAULT_BOOKING_QUERY, sortBy: "totalPrice", sortDir: "asc", pageSize: 50 });
      const prices = cheapFirst.items.map((item) => item.totalPrice);
      expect(prices).toEqual([...prices].sort((a, b) => a - b));

      const dearFirst = await listBookings({ ...DEFAULT_BOOKING_QUERY, sortBy: "totalPrice", sortDir: "desc", pageSize: 50 });
      expect(dearFirst.items[0].totalPrice).toBeGreaterThanOrEqual(dearFirst.items[1].totalPrice);
    });

    it("treats % and _ in the search box as plain characters", async () => {
      for (const search of ["%", "_", "\\"]) {
        const result = await listBookings({ ...DEFAULT_BOOKING_QUERY, search });
        expect(result.total).toBe(0);
      }
    });

    it("moves to the last page when the page number is too high", async () => {
      const result = await listBookings({ ...DEFAULT_BOOKING_QUERY, page: 9999, pageSize: 10 });
      expect(result.page).toBe(result.totalPages);
      expect(result.items.length).toBeGreaterThan(0);
    });
  });
});
