import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { BookingWizard } from "@/components/booking/BookingWizard";
import { isValidISODate } from "@/lib/dates";
import { getBookedRanges, getVehicle } from "@/server/services/vehicleService";

export const metadata: Metadata = { title: "Book your car" };

type Props = {
  params: Promise<{ vehicleId: string }>;
  searchParams: Promise<{ startDate?: string; endDate?: string }>;
};

export default async function BookPage({ params, searchParams }: Props) {
  const { vehicleId } = await params;
  const vehicle = await getVehicle(vehicleId);
  if (!vehicle) notFound();
  if (vehicle.status !== "available") redirect(`/vehicles/${vehicle.id}`);

  const { startDate, endDate } = await searchParams;
  const initialDates =
    startDate && endDate && isValidISODate(startDate) && isValidISODate(endDate) ? { startDate, endDate } : undefined;

  const bookedRanges = await getBookedRanges(vehicle.id);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="mb-6 text-3xl font-bold">Book the {vehicle.name}</h1>
      <BookingWizard vehicle={vehicle} bookedRanges={bookedRanges} initialDates={initialDates} />
    </div>
  );
}
