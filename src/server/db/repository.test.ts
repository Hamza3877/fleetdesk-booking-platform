// @vitest-environment node
import { expect, it } from "vitest";
import { addDays, todayISO } from "@/lib/dates";
import { getRepository } from "@/server/db";
import { ConflictError } from "@/server/errors";
import { deleteVehicle, createVehicle, getVehicle, listVehicles, updateVehicle } from "@/server/services/vehicleService";
import { getSettings, updateSettings } from "@/server/services/settingsService";
import { describeWithBackends } from "@/server/testing/backends";
import type { VehicleInput } from "@/lib/schemas";

const newVehicle: VehicleInput = {
  name: "Test Van",
  make: "Test",
  model: "Van",
  year: 2024,
  category: "van",
  transmission: "automatic",
  fuel: "diesel",
  seats: 8,
  pricePerDay: 77,
  description: "A van used only by the automated tests.",
  features: ["Roof \"rack\"", "Cup, holders", "Back\\slash"],
  color: "#123456",
  imageUrl: "",
  status: "available",
  featured: false,
};

const customer = { customerName: "Repo Tester", customerEmail: "repo@example.com", customerPhone: "+1 555 0101" };

/** Contract tests: both data stores must behave identically. */
describeWithBackends("repository contract", () => {
  it("saves and reads a vehicle, including awkward characters in its features", async () => {
    const created = await createVehicle(newVehicle);
    const loaded = await getVehicle(created.id);

    expect(loaded).toMatchObject({ ...newVehicle, id: created.id });
    expect(loaded?.features).toEqual(newVehicle.features);
    expect(new Date(loaded!.createdAt).toString()).not.toBe("Invalid Date");
  });

  it("updates only the fields that were sent", async () => {
    const created = await createVehicle(newVehicle);
    const updated = await updateVehicle(created.id, { pricePerDay: 99, status: "maintenance" });

    expect(updated.pricePerDay).toBe(99);
    expect(updated.status).toBe("maintenance");
    expect(updated.name).toBe("Test Van");
    expect(updated.features).toEqual(newVehicle.features);
    expect(await listVehicles({ status: "available", search: "Test Van" })).toHaveLength(0);
  });

  it("deletes a vehicle that has no bookings", async () => {
    const created = await createVehicle(newVehicle);
    await deleteVehicle(created.id);
    expect(await getVehicle(created.id)).toBeUndefined();
  });

  it("keeps a vehicle that has booking history", async () => {
    const [vehicle] = await getRepository().vehicles.list();
    await expect(deleteVehicle(vehicle.id)).rejects.toThrow(ConflictError);
    expect(await getVehicle(vehicle.id)).toBeDefined();
  });

  it("returns dates as plain YYYY-MM-DD text and created times as ISO strings", async () => {
    const [booking] = await getRepository().bookings.list();
    expect(booking.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(booking.endDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(booking.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("numbers new bookings after the highest existing reference", async () => {
    const repo = getRepository();
    const [vehicle] = await listVehicles({ status: "available" });
    const start = addDays(todayISO(), 200);
    const base = { vehicleId: vehicle.id, ...customer, totalPrice: 100, status: "pending" as const, paymentStatus: "unpaid" as const, createdAt: new Date().toISOString() };

    const first = await repo.bookings.insert({ ...base, id: "bk_ref_1", startDate: start, endDate: addDays(start, 1) });
    const second = await repo.bookings.insert({ ...base, id: "bk_ref_2", startDate: addDays(start, 5), endDate: addDays(start, 6) });

    const existing = (await repo.bookings.list()).filter((booking) => booking.id.startsWith("bk_ref_") === false);
    const highest = Math.max(...existing.map((booking) => Number(booking.reference.slice(3))));
    expect(Number(first.reference.slice(3))).toBe(highest + 1);
    expect(Number(second.reference.slice(3))).toBe(highest + 2);
  });

  it("rejects overlapping bookings at the storage level, even if a service check was skipped", async () => {
    const repo = getRepository();
    const [vehicle] = await listVehicles({ status: "available" });
    const start = addDays(todayISO(), 250);
    const base = { vehicleId: vehicle.id, ...customer, totalPrice: 100, status: "confirmed" as const, paymentStatus: "paid" as const, createdAt: new Date().toISOString() };

    await repo.bookings.insert({ ...base, id: "bk_over_1", startDate: start, endDate: addDays(start, 4) });

    await expect(
      repo.bookings.insert({ ...base, id: "bk_over_2", startDate: addDays(start, 2), endDate: addDays(start, 6) }),
    ).rejects.toThrow(ConflictError);

    // Back-to-back is fine, and a cancelled booking never blocks anyone.
    await expect(repo.bookings.insert({ ...base, id: "bk_over_3", startDate: addDays(start, 4), endDate: addDays(start, 5) })).resolves.toBeDefined();
    await expect(
      repo.bookings.insert({ ...base, id: "bk_over_4", status: "cancelled", startDate: start, endDate: addDays(start, 4) }),
    ).resolves.toBeDefined();
  });

  it("cannot bring a cancelled booking back if its dates were taken meanwhile", async () => {
    const repo = getRepository();
    const [vehicle] = await listVehicles({ status: "available" });
    const start = addDays(todayISO(), 300);
    const base = { vehicleId: vehicle.id, ...customer, totalPrice: 100, paymentStatus: "unpaid" as const, createdAt: new Date().toISOString(), startDate: start, endDate: addDays(start, 3) };

    await repo.bookings.insert({ ...base, id: "bk_back_1", status: "cancelled" });
    await repo.bookings.insert({ ...base, id: "bk_back_2", status: "pending" });

    await expect(repo.bookings.update("bk_back_1", { status: "confirmed" })).rejects.toThrow(ConflictError);
  });

  it("cancels only unpaid checkouts older than the cutoff", async () => {
    const repo = getRepository();
    const [vehicle] = await listVehicles({ status: "available" });
    const start = addDays(todayISO(), 350);
    const base = { vehicleId: vehicle.id, ...customer, totalPrice: 100, status: "pending" as const, paymentStatus: "unpaid" as const };
    const old = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

    await repo.bookings.insert({ ...base, id: "bk_hold_old", startDate: start, endDate: addDays(start, 1), createdAt: old });
    await repo.bookings.insert({ ...base, id: "bk_hold_new", startDate: addDays(start, 5), endDate: addDays(start, 6), createdAt: new Date().toISOString() });

    expect(await repo.bookings.cancelExpiredHolds(Date.now() - 30 * 60 * 1000)).toBe(1);
    expect((await repo.bookings.get("bk_hold_old"))?.status).toBe("cancelled");
    expect((await repo.bookings.get("bk_hold_new"))?.status).toBe("pending");
  });

  it("saves business settings", async () => {
    const saved = await updateSettings({ businessName: "Test Rentals", supportEmail: "t@example.com", phone: "+1 555 0000", city: "Lahore" });
    expect(saved.businessName).toBe("Test Rentals");
    expect(await getSettings()).toEqual(saved);
  });
});
