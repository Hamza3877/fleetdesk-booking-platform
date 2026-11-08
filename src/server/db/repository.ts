import type { BookingQuery } from "@/lib/bookingQuery";
import type { Booking, BookingListItem, BookingStatus, BusinessSettings, Paginated, PaymentStatus, Vehicle } from "@/types";


export type NewBooking = Omit<Booking, "reference">;

export interface VehicleRepository {
  list(): Promise<Vehicle[]>;
  get(id: string): Promise<Vehicle | undefined>;
  insert(vehicle: Vehicle): Promise<Vehicle>;
  update(id: string, changes: Partial<Omit<Vehicle, "id" | "createdAt">>): Promise<Vehicle | undefined>;
  remove(id: string): Promise<boolean>;
}

export interface BookingRepository {
  list(): Promise<Booking[]>;
  get(id: string): Promise<Booking | undefined>;
  listBlocking(filter?: { vehicleId?: string; endsAfter?: string }): Promise<Booking[]>;
  hasAnyForVehicle(vehicleId: string): Promise<boolean>;
  insert(booking: NewBooking): Promise<Booking>;
  update(id: string, changes: { status?: BookingStatus; paymentStatus?: PaymentStatus }): Promise<Booking | undefined>;
  cancelExpiredHolds(createdBeforeMs: number): Promise<number>;
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
