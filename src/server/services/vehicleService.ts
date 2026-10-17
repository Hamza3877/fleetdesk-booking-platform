import { hasRangeConflict, todayISO } from "@/lib/dates";
import type { VehicleFilters } from "@/lib/vehicleFilters";
import type { VehicleInput } from "@/lib/schemas";
import { getRepository } from "@/server/db";
import { ConflictError, NotFoundError } from "@/server/errors";
import { getBlockingBookings } from "@/server/services/bookingService";
import type { DateRange, Vehicle } from "@/types";

export async function listVehicles(filters: VehicleFilters = {}): Promise<Vehicle[]> {
  const search = filters.search?.toLowerCase();
  const vehicles = await getRepository().vehicles.list();

  // Only load bookings when the customer asked for specific dates.
  const wantsDates = Boolean(filters.startDate && filters.endDate);
  const blocking = wantsDates ? await getBlockingBookings() : [];

  return vehicles
    .filter((vehicle) => {
      if (filters.status && vehicle.status !== filters.status) return false;
      if (filters.category && vehicle.category !== filters.category) return false;
      if (filters.maxPrice !== undefined && vehicle.pricePerDay > filters.maxPrice) return false;
      if (filters.featured !== undefined && vehicle.featured !== filters.featured) return false;
      if (search && !`${vehicle.name} ${vehicle.make} ${vehicle.model}`.toLowerCase().includes(search)) return false;
      if (filters.startDate && filters.endDate) {
        const taken = blocking.filter((booking) => booking.vehicleId === vehicle.id);
        if (hasRangeConflict(taken, { startDate: filters.startDate, endDate: filters.endDate })) return false;
      }
      return true;
    })
    .sort((a, b) => a.pricePerDay - b.pricePerDay);
}

export function getVehicle(id: string): Promise<Vehicle | undefined> {
  return getRepository().vehicles.get(id);
}

export function createVehicle(input: VehicleInput): Promise<Vehicle> {
  return getRepository().vehicles.insert({
    ...input,
    id: `veh_${crypto.randomUUID().slice(0, 8)}`,
    createdAt: new Date().toISOString(),
  });
}

export async function updateVehicle(id: string, changes: Partial<VehicleInput>): Promise<Vehicle> {
  const vehicle = await getRepository().vehicles.update(id, changes);
  if (!vehicle) throw new NotFoundError("Vehicle not found");
  return vehicle;
}

export async function deleteVehicle(id: string): Promise<void> {
  const repo = getRepository();
  if (!(await repo.vehicles.get(id))) throw new NotFoundError("Vehicle not found");

  const upcoming = await getBlockingBookings({ vehicleId: id, endsAfter: todayISO() });
  if (upcoming.length > 0) {
    throw new ConflictError("This vehicle has upcoming bookings. Cancel them first or mark it as in maintenance.");
  }
  // Past bookings are the business's revenue history, so a vehicle that has any is kept.
  if (await repo.bookings.hasAnyForVehicle(id)) {
    throw new ConflictError("This vehicle has booking history, so it can't be deleted. Mark it as in maintenance to hide it from the website.");
  }

  await repo.vehicles.remove(id);
}

/** Days when the vehicle is already taken (past bookings are left out). */
export async function getBookedRanges(vehicleId: string): Promise<DateRange[]> {
  const bookings = await getBlockingBookings({ vehicleId, endsAfter: todayISO() });
  return bookings
    .map(({ startDate, endDate }) => ({ startDate, endDate }))
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
}
