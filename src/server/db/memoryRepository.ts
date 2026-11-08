import type { Booking, BookingListItem, Vehicle } from "@/types";
import { MAX_PAGE_SIZE, type BookingQuery } from "@/lib/bookingQuery";
import { hasRangeConflict } from "@/lib/dates";
import { ConflictError } from "@/server/errors";
import { buildSeedData, type Database } from "@/server/db/seed";
import type { Repository } from "@/server/db/repository";


const globalForDb = globalThis as unknown as { __fleetdeskDb?: Database };

function db(): Database {
  globalForDb.__fleetdeskDb ??= buildSeedData();
  return globalForDb.__fleetdeskDb;
}

export function resetMemoryDb(today?: string): void {
  globalForDb.__fleetdeskDb = buildSeedData(today);
}

const OVERLAP_MESSAGE = "Those dates were just taken. Please pick different dates.";

function overlapsAnother(booking: Pick<Booking, "id" | "vehicleId" | "startDate" | "endDate">): boolean {
  const others = db().bookings.filter(
    (item) => item.id !== booking.id && item.vehicleId === booking.vehicleId && item.status !== "cancelled",
  );
  return hasRangeConflict(others, booking);
}

const copyVehicle = (vehicle: Vehicle): Vehicle => ({ ...vehicle, features: [...vehicle.features] });
const copyBooking = (booking: Booking): Booking => ({ ...booking });

const SORTERS: Record<BookingQuery["sortBy"], (a: BookingListItem, b: BookingListItem) => number> = {
  createdAt: (a, b) => a.createdAt.localeCompare(b.createdAt),
  startDate: (a, b) => a.startDate.localeCompare(b.startDate),
  totalPrice: (a, b) => a.totalPrice - b.totalPrice,
  customerName: (a, b) => a.customerName.localeCompare(b.customerName),
};

export function createMemoryRepository(): Repository {
  return {
    vehicles: {
      async list() {
        return db().vehicles.map(copyVehicle);
      },
      async get(id) {
        const vehicle = db().vehicles.find((item) => item.id === id);
        return vehicle && copyVehicle(vehicle);
      },
      async insert(vehicle) {
        db().vehicles.push(copyVehicle(vehicle));
        return copyVehicle(vehicle);
      },
      async update(id, changes) {
        const vehicle = db().vehicles.find((item) => item.id === id);
        if (!vehicle) return undefined;
        Object.assign(vehicle, changes);
        return copyVehicle(vehicle);
      },
      async remove(id) {
        const index = db().vehicles.findIndex((item) => item.id === id);
        if (index === -1) return false;
        db().vehicles.splice(index, 1);
        return true;
      },
    },

    bookings: {
      async list() {
        return db().bookings.map(copyBooking);
      },
      async get(id) {
        const booking = db().bookings.find((item) => item.id === id);
        return booking && copyBooking(booking);
      },
      async listBlocking(filter = {}) {
        return db()
          .bookings.filter((booking) => booking.status !== "cancelled")
          .filter((booking) => !filter.vehicleId || booking.vehicleId === filter.vehicleId)
          .filter((booking) => !filter.endsAfter || booking.endDate > filter.endsAfter)
          .map(copyBooking);
      },
      async hasAnyForVehicle(vehicleId) {
        return db().bookings.some((booking) => booking.vehicleId === vehicleId);
      },
      async insert(booking) {
        if (booking.status !== "cancelled" && overlapsAnother(booking)) throw new ConflictError(OVERLAP_MESSAGE);
        const highest = db().bookings.reduce((max, item) => {
          const number = Number.parseInt(item.reference.replace("FD-", ""), 10);
          return Number.isFinite(number) ? Math.max(max, number) : max;
        }, 1000);
        const saved: Booking = { ...booking, reference: `FD-${highest + 1}` };
        db().bookings.push(saved);
        return copyBooking(saved);
      },
      async update(id, changes) {
        const booking = db().bookings.find((item) => item.id === id);
        if (!booking) return undefined;
        if (changes.status && changes.status !== "cancelled" && overlapsAnother(booking)) {
          throw new ConflictError(OVERLAP_MESSAGE);
        }
        if (changes.status) booking.status = changes.status;
        if (changes.paymentStatus) booking.paymentStatus = changes.paymentStatus;
        return copyBooking(booking);
      },
      async cancelExpiredHolds(createdBeforeMs) {
        let cancelled = 0;
        for (const booking of db().bookings) {
          const isStaleHold =
            booking.status === "pending" &&
            booking.paymentStatus === "unpaid" &&
            Date.parse(booking.createdAt) < createdBeforeMs;
          if (isStaleHold) {
            booking.status = "cancelled";
            cancelled += 1;
          }
        }
        return cancelled;
      },
      async search(query) {
        const search = query.search.toLowerCase();
        const pageSize = Math.min(Math.max(query.pageSize, 1), MAX_PAGE_SIZE);
        const vehicleNames = new Map(db().vehicles.map((vehicle) => [vehicle.id, vehicle.name]));

        const matches = db()
          .bookings.map((booking): BookingListItem => ({ ...booking, vehicleName: vehicleNames.get(booking.vehicleId) ?? "" }))
          .filter((booking) => {
            if (query.status !== "all" && booking.status !== query.status) return false;
            if (!search) return true;
            return `${booking.reference} ${booking.customerName} ${booking.customerEmail} ${booking.vehicleName}`
              .toLowerCase()
              .includes(search);
          })
          .sort((a, b) => {
            const result = SORTERS[query.sortBy](a, b);
            return query.sortDir === "asc" ? result : -result;
          });

        const totalPages = Math.max(Math.ceil(matches.length / pageSize), 1);
        const page = Math.min(Math.max(query.page, 1), totalPages);
        return {
          items: matches.slice((page - 1) * pageSize, page * pageSize),
          total: matches.length,
          page,
          pageSize,
          totalPages,
        };
      },
    },

    settings: {
      async get() {
        return { ...db().settings };
      },
      async save(settings) {
        db().settings = { ...settings };
        return { ...db().settings };
      },
    },
  };
}
