import { ALLOWED_TRANSITIONS } from "@/lib/bookingStatus";
import { hasRangeConflict } from "@/lib/dates";
import { calculateQuote } from "@/lib/pricing";
import type { BookingQuery } from "@/lib/bookingQuery";
import type { BookingInput } from "@/lib/schemas";
import { getRepository } from "@/server/db";
import { ConflictError, NotFoundError } from "@/server/errors";
import type { Booking, BookingListItem, BookingStatus, Paginated } from "@/types";

/**
 * Booking rules. This file decides WHAT is allowed; the repository (src/server/db) only stores data.
 *
 * "pending" means the customer is in checkout. We hold the car for HOLD_MINUTES;
 * if they don't pay in time the hold is released automatically.
 * The allowed status changes live in lib/bookingStatus.ts (shared with the dashboard).
 *
 * Double booking is checked twice: here (for a friendly message) and by the database
 * itself (a constraint in supabase/schema.sql), which also protects against two customers
 * booking at exactly the same moment.
 */
export const HOLD_MINUTES = 30;

/** Cancel checkouts that were never paid within the hold time. */
export async function releaseExpiredHolds(now: number = Date.now()): Promise<void> {
  await getRepository().bookings.cancelExpiredHolds(now - HOLD_MINUTES * 60 * 1000);
}

/** Bookings that currently block the calendar (everything except cancelled ones). */
export async function getBlockingBookings(filter?: { vehicleId?: string; endsAfter?: string }): Promise<Booking[]> {
  await releaseExpiredHolds();
  return getRepository().bookings.listBlocking(filter);
}

async function isVehicleFree(vehicleId: string, startDate: string, endDate: string, ignoreBookingId?: string) {
  const taken = (await getBlockingBookings({ vehicleId }))
    .filter((booking) => booking.id !== ignoreBookingId)
    .map(({ startDate: start, endDate: end }) => ({ startDate: start, endDate: end }));
  return !hasRangeConflict(taken, { startDate, endDate });
}

export async function getBooking(id: string): Promise<Booking | undefined> {
  await releaseExpiredHolds();
  return getRepository().bookings.get(id);
}

export async function createBooking(input: BookingInput): Promise<Booking> {
  await releaseExpiredHolds();
  const repo = getRepository();

  const vehicle = await repo.vehicles.get(input.vehicleId);
  if (!vehicle) throw new NotFoundError("Vehicle not found");
  if (vehicle.status !== "available") {
    throw new ConflictError("This vehicle isn't available for booking right now.");
  }
  if (!(await isVehicleFree(vehicle.id, input.startDate, input.endDate))) {
    throw new ConflictError("Those dates were just taken. Please pick different dates.");
  }

  const quote = calculateQuote(vehicle.pricePerDay, input.startDate, input.endDate);
  return repo.bookings.insert({
    id: `bk_${crypto.randomUUID().slice(0, 8)}`,
    vehicleId: vehicle.id,
    customerName: input.customerName,
    customerEmail: input.customerEmail,
    customerPhone: input.customerPhone,
    startDate: input.startDate,
    endDate: input.endDate,
    totalPrice: quote.total,
    status: "pending",
    paymentStatus: "unpaid",
    createdAt: new Date().toISOString(),
  });
}

/** Called once the payment went through. Safe to call twice. */
export async function markBookingPaid(id: string): Promise<Booking> {
  const booking = await getBooking(id);
  if (!booking) throw new NotFoundError("Booking not found");
  if (booking.paymentStatus === "paid") return booking;

  // The hold may have expired while the customer was paying. Re-confirm only if
  // nobody else took the dates in the meantime.
  if (booking.status === "cancelled" && !(await isVehicleFree(booking.vehicleId, booking.startDate, booking.endDate, booking.id))) {
    throw new ConflictError("Your checkout expired and the dates were booked by someone else.");
  }

  const updated = await getRepository().bookings.update(id, { paymentStatus: "paid", status: "confirmed" });
  if (!updated) throw new NotFoundError("Booking not found");
  return updated;
}

export async function updateBookingStatus(id: string, status: BookingStatus): Promise<Booking> {
  const booking = await getBooking(id);
  if (!booking) throw new NotFoundError("Booking not found");

  if (!ALLOWED_TRANSITIONS[booking.status].includes(status)) {
    throw new ConflictError(`A ${booking.status} booking can't be changed to ${status}.`);
  }

  // Cancelling a paid booking refunds it.
  const refund = status === "cancelled" && booking.paymentStatus === "paid";
  const updated = await getRepository().bookings.update(id, {
    status,
    ...(refund ? { paymentStatus: "refunded" as const } : {}),
  });
  if (!updated) throw new NotFoundError("Booking not found");
  return updated;
}

/** Search, filter, sort and paginate. The repository does it (in SQL when a database is used). */
export async function listBookings(query: BookingQuery): Promise<Paginated<BookingListItem>> {
  await releaseExpiredHolds();
  return getRepository().bookings.search(query);
}
