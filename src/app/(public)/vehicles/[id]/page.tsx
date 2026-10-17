import { Check } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { BookingPanel } from "@/components/vehicles/BookingPanel";
import { VehicleImage } from "@/components/vehicles/VehicleImage";
import { VehicleSpecs } from "@/components/vehicles/VehicleSpecs";
import { isValidISODate } from "@/lib/dates";
import { CATEGORY_LABELS } from "@/lib/labels";
import { getBookedRanges, getVehicle } from "@/server/services/vehicleService";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ startDate?: string; endDate?: string }>;
};

export async function generateMetadata({ params }: Pick<Props, "params">): Promise<Metadata> {
  const vehicle = await getVehicle((await params).id);
  return vehicle
    ? { title: vehicle.name, description: vehicle.description }
    : { title: "Vehicle not found" };
}

export default async function VehicleDetailPage({ params, searchParams }: Props) {
  const vehicle = await getVehicle((await params).id);
  if (!vehicle) notFound();
  const bookedRanges = vehicle.status === "available" ? await getBookedRanges(vehicle.id) : [];

  const { startDate, endDate } = await searchParams;
  const initialDates =
    startDate && endDate && isValidISODate(startDate) && isValidISODate(endDate) && endDate > startDate
      ? { startDate, endDate }
      : undefined;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted-foreground">
        <Link href="/vehicles" className="hover:text-foreground">
          Our fleet
        </Link>{" "}
        / <span className="text-foreground">{vehicle.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div>
          <VehicleImage vehicle={vehicle} priority className="aspect-[16/9] rounded-2xl border border-border" />

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold">{vehicle.name}</h1>
            <Badge tone="info">{CATEGORY_LABELS[vehicle.category]}</Badge>
            {vehicle.status === "maintenance" && <Badge tone="warning">Unavailable</Badge>}
          </div>
          <p className="mt-1 text-muted-foreground">{vehicle.year}</p>
          <div className="mt-4">
            <VehicleSpecs vehicle={vehicle} />
          </div>

          <p className="mt-6 text-lg leading-relaxed">{vehicle.description}</p>

          {vehicle.features.length > 0 && (
            <section className="mt-8" aria-labelledby="features-heading">
              <h2 id="features-heading" className="mb-3 text-lg font-semibold">
                What&apos;s included
              </h2>
              <ul className="grid gap-2 sm:grid-cols-2">
                {vehicle.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <Check className="size-4 text-success" aria-hidden /> {feature}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {vehicle.status === "available" ? (
          <BookingPanel
            vehicleId={vehicle.id}
            pricePerDay={vehicle.pricePerDay}
            bookedRanges={bookedRanges}
            initialDates={initialDates}
          />
        ) : (
          <aside className="h-fit rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">
            This vehicle is in maintenance and can&apos;t be booked right now.{" "}
            <Link href="/vehicles" className="font-medium text-primary hover:underline">
              See other vehicles
            </Link>
            .
          </aside>
        )}
      </div>
    </div>
  );
}
