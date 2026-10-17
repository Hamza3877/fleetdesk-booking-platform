import type { BookingQuery } from "@/lib/bookingQuery";
import type { Booking, BookingListItem, BookingStatus, BusinessSettings, Paginated, PaymentStatus, Vehicle } from "@/types";

/**
 * The data-access contract. It only stores and fetches data; it knows nothing about
 * business rules (prices, status changes, holds). Those live in src/server/services.
 *
 * Two implementations exist:
 *   - memoryRepository.ts    demo data in server memory (default, zero setup)
 *   - postgresRepository.ts  a real PostgreSQL database such as Supabase (set DATABASE_URL)
 *
 * Services only talk to this interface, so the app behaves the same with either one.
 */

/** A booking before the database has given it a reference number (FD-1001, ...). */
export type NewBooking = Omit<Booking, "reference">;

export interface VehicleRepository {
  list(): Promise<Vehicle[]>;
  get(id: string): Promise<Vehicle | undefined>;
  insert(vehicle: Vehicle): Promise<Vehicle>;
  /** Returns undefined when the vehicle doesn't exist. */
  update(id: string, changes: Partial<Omit<Vehicle, "id" | "createdAt">>): Promise<Vehicle | undefined>;
  remove(id: string): Promise<boolean>;
}

export interface BookingRepository {
  list(): Promise<Booking[]>;
  get(id: string): Promise<Booking | undefined>;
  /** Bookings that block the calendar (everything except cancelled), optionally narrowed down. */
  listBlocking(filter?: { vehicleId?: string; endsAfter?: string }): Promise<Booking[]>;
  hasAnyForVehicle(vehicleId: string): Promise<boolean>;
  /** Throws ConflictError if the dates overlap another booking of the same vehicle. */
  insert(booking: NewBooking): Promise<Booking>;
  /** Throws ConflictError if re-activating the booking would overlap another one. */
  update(id: string, changes: { status?: BookingStatus; paymentStatus?: PaymentStatus }): Promise<Booking | undefined>;
  /** Cancels unpaid checkouts created before the cutoff. Returns how many were cancelled. */
  cancelExpiredHolds(createdBeforeMs: number): Promise<number>;
  /** Search, filter, sort and paginate. */
  search(query: BookingQuery): Promise<Paginated<BookingListItem>>;
}

export interface SettingsRepository {
  get(): Promise<BusinessSettings>;
  save(settings: BusinessSettings): Promise<BusinessSettings>;
}

export interface Repository {
  vehicles: VehicleRepository;
  bookings: BookingRepository;
  settings: SettingsRepository;
}
